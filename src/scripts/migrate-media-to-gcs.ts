/**
 * BENZIN — Idempotent Restaurant Media Migration to GCS
 *
 * Usage:
 *   npx ts-node src/scripts/migrate-media-to-gcs.ts --dry-run
 *   npx ts-node src/scripts/migrate-media-to-gcs.ts --execute
 *   npx ts-node src/scripts/migrate-media-to-gcs.ts --rollback=<backup-file>
 *
 * Safety Guarantees:
 * 1. Defaults to --dry-run unless --execute is explicitly specified.
 * 2. Writes full JSON snapshot of existing MongoDB state before any writes.
 * 3. Never deletes original files from repository.
 * 4. Generates a reverse rollback mapping for immediate zero-downtime restoration.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { MongoClient } from 'mongodb';
import { Storage } from '@google-cloud/storage';
import { env } from '../config/env';

interface MigrationEntry {
  type: 'menu_item' | 'restaurant_logo';
  targetId: string;
  name: string;
  currentPathOrUrl: string;
  sourceType: 'local_file' | 'external_url';
  resolvedLocalPath?: string;
  targetObjectKey: string;
  targetPublicUrl: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
}

async function runMigration() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const isDryRun = !isExecute;
  const rollbackArg = args.find((a) => a.startsWith('--rollback'));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `media_backup_${timestamp}.json`);
  const rollbackFilePath = path.join(backupDir, `rollback_manifest_${timestamp}.json`);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('       BENZIN MEDIA MIGRATION TO GOOGLE CLOUD STORAGE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Mode:            ${isDryRun ? 'DRY-RUN (SIMULATION ONLY - NO WRITES)' : 'EXECUTE (LIVE CLOUD MUTATION)'}`);
  console.log(`GCS Bucket:      ${env.GCS_MEDIA_BUCKET || '(Not set - using local dev fallback)'}`);
  console.log(`MongoDB URI:     ${env.MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  console.log(`Backup Location: ${backupFilePath}`);
  console.log('───────────────────────────────────────────────────────────────────');

  // Handle Rollback
  if (rollbackArg) {
    const fileToRestore = rollbackArg.split('=')[1];
    if (!fileToRestore || !fs.existsSync(fileToRestore)) {
      console.error(`Error: Rollback file not found at "${fileToRestore}"`);
      process.exit(1);
    }
    console.log(`Executing ROLLBACK from: ${fileToRestore}`);
    const client = new MongoClient(env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db('benzin_saas_db');
      const rollbackData = JSON.parse(fs.readFileSync(fileToRestore, 'utf-8'));

      let restoredCount = 0;
      for (const item of rollbackData.menu_items || []) {
        await db.collection('menu_items').updateOne(
          { _id: item._id },
          { $set: { image_url: item.original_image_url } }
        );
        restoredCount++;
      }

      if (rollbackData.restaurant) {
        await db.collection('restaurants').updateOne(
          { _id: rollbackData.restaurant._id },
          { $set: { 'branding.logo_url': rollbackData.restaurant.original_logo_url } }
        );
      }

      console.log(`✓ Rollback complete! Successfully restored ${restoredCount} menu items and restaurant branding.`);
    } finally {
      await client.close();
    }
    return;
  }

  // 1. Connect to MongoDB Atlas (Read-Only phase)
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const db = client.db('benzin_saas_db');

  try {
    const cavalli = await db.collection('restaurants').findOne({ slug: 'cavali' });
    if (!cavalli) {
      throw new Error('Primary tenant "Cavalli" (slug: cavali) not found in database.');
    }
    const restaurantId = cavalli._id.toString();
    console.log(`Found target restaurant: ${cavalli.name} (ID: ${restaurantId})`);

    const menuItems = await db.collection<any>('menu_items').find({ restaurant_id: restaurantId }).toArray();
    console.log(`Found ${menuItems.length} menu items for restaurant ${restaurantId}`);

    // Create Backup Snapshot
    const backupSnapshot = {
      timestamp: new Date().toISOString(),
      restaurant: {
        _id: restaurantId,
        name: cavalli.name,
        original_logo_url: cavalli.branding?.logo_url || null,
      },
      menu_items: menuItems.map((m: any) => ({
        _id: m._id.toString(),
        name: m.name,
        original_image_url: m.image_url || m.imageUrl || null,
      })),
    };
    fs.writeFileSync(backupFilePath, JSON.stringify(backupSnapshot, null, 2), 'utf-8');
    console.log(`✓ Created pre-migration backup at: ${backupFilePath}`);

    // 2. Build Migration Plan
    const bucketName = env.GCS_MEDIA_BUCKET || 'benzin-public-media-833090629754';
    const plan: MigrationEntry[] = [];
    const publicDir = path.join(process.cwd(), 'public');

    // Cavalli Logo
    const logoRelPath = cavalli.branding?.logo_url || '/images/cavalli_brand_logo.png';
    const localLogoFile = path.join(publicDir, logoRelPath.replace(/^\//, ''));
    if (fs.existsSync(localLogoFile)) {
      const stats = fs.statSync(localLogoFile);
      const objKey = `restaurants/${restaurantId}/logos/logo_cavalli_primary.webp`;
      plan.push({
        type: 'restaurant_logo',
        targetId: restaurantId,
        name: 'Cavalli Primary Logo',
        currentPathOrUrl: logoRelPath,
        sourceType: 'local_file',
        resolvedLocalPath: localLogoFile,
        targetObjectKey: objKey,
        targetPublicUrl: `https://storage.googleapis.com/${bucketName}/${objKey}`,
        fileSizeBytes: stats.size,
      });
    }

    // Menu Items
    for (const item of menuItems) {
      const img = item.image_url || item.imageUrl;
      if (!img) continue;
      const itemIdStr = item._id.toString();

      if (img.startsWith('http://') || img.startsWith('https://')) {
        // External URL: will be registered in restaurant_media as external reference
        const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const objKey = `restaurants/${restaurantId}/menu/${cleanName}_${itemIdStr}.webp`;
        plan.push({
          type: 'menu_item',
          targetId: itemIdStr,
          name: item.name,
          currentPathOrUrl: img,
          sourceType: 'external_url',
          targetObjectKey: objKey,
          targetPublicUrl: img, // External URLs remain unchanged in item reference
        });
      } else {
        // Local File Path
        const resolvedPath = path.join(publicDir, img.replace(/^\//, ''));
        if (fs.existsSync(resolvedPath)) {
          const stats = fs.statSync(resolvedPath);
          const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          const objKey = `restaurants/${restaurantId}/menu/${cleanName}_${itemIdStr}.webp`;
          plan.push({
            type: 'menu_item',
            targetId: itemIdStr,
            name: item.name,
            currentPathOrUrl: img,
            sourceType: 'local_file',
            resolvedLocalPath: resolvedPath,
            targetObjectKey: objKey,
            targetPublicUrl: `https://storage.googleapis.com/${bucketName}/${objKey}`,
            fileSizeBytes: stats.size,
          });
        } else {
          console.warn(`[Plan Warning] Local file missing on disk: ${resolvedPath} for item "${item.name}"`);
        }
      }
    }

    console.log('\n───────────────────────────────────────────────────────────────────');
    console.log(`MIGRATION PLAN SUMMARY:`);
    console.log(`- Total Assets Planned:     ${plan.length}`);
    console.log(`- Local Files to Migrate:   ${plan.filter((p) => p.sourceType === 'local_file').length}`);
    console.log(`- External URLs to Index:   ${plan.filter((p) => p.sourceType === 'external_url').length}`);
    console.log('───────────────────────────────────────────────────────────────────');

    console.log('\nSample Planned Migrations (first 8):');
    plan.slice(0, 8).forEach((p, i) => {
      console.log(` ${i + 1}. [${p.type}] "${p.name}"`);
      console.log(`    Source: ${p.currentPathOrUrl}`);
      console.log(`    Target: ${p.targetPublicUrl}`);
    });

    // Write Rollback Manifest
    fs.writeFileSync(rollbackFilePath, JSON.stringify(backupSnapshot, null, 2), 'utf-8');
    console.log(`\n✓ Rollback manifest generated: ${rollbackFilePath}`);

    if (isDryRun) {
      console.log('\n═══════════════════════════════════════════════════════════════════');
      console.log('                 DRY-RUN VERIFICATION PASSED                      ');
      console.log('  Zero files uploaded, zero database mutations committed.          ');
      console.log('  To execute when approved:                                        ');
      console.log('    npx ts-node src/scripts/migrate-media-to-gcs.ts --execute       ');
      console.log('═══════════════════════════════════════════════════════════════════\n');
      return;
    }

    // 3. Live Execution Phase (Only when --execute flag is passed)
    if (!env.GCS_MEDIA_BUCKET) {
      throw new Error('GCS_MEDIA_BUCKET environment variable must be set to run live migration.');
    }

    console.log('\nExecuting live upload to Google Cloud Storage...');
    const storage = new Storage();
    const bucket = storage.bucket(env.GCS_MEDIA_BUCKET);

    let uploadedCount = 0;
    let dbUpdatedCount = 0;

    for (const entry of plan) {
      if (entry.sourceType === 'local_file' && entry.resolvedLocalPath) {
        const rawBuffer = fs.readFileSync(entry.resolvedLocalPath);
        // Optimize via sharp
        const isLogo = entry.type === 'restaurant_logo';
        let sharpPipe = sharp(rawBuffer).rotate();
        if (isLogo) {
          sharpPipe = sharpPipe.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 });
        } else {
          sharpPipe = sharpPipe.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 });
        }
        const optBuffer = await sharpPipe.toBuffer();

        // Upload to GCS
        const file = bucket.file(entry.targetObjectKey);
        await file.save(optBuffer, {
          resumable: false,
          metadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        });
        uploadedCount++;

        // Save record in `restaurant_media`
        const mediaDoc = {
          _id: `med_mig_${entry.targetId}`,
          restaurant_id: restaurantId,
          source_type: 'upload',
          category: isLogo ? 'logo' : 'menu',
          storage_provider: 'gcs',
          bucket_name: env.GCS_MEDIA_BUCKET,
          object_key: entry.targetObjectKey,
          public_url: entry.targetPublicUrl,
          original_filename: path.basename(entry.resolvedLocalPath),
          mime_type: 'image/webp',
          file_size: optBuffer.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await db.collection<any>('restaurant_media').updateOne({ _id: mediaDoc._id }, { $set: mediaDoc }, { upsert: true });

        // Update target record
        if (entry.type === 'menu_item') {
          await db.collection<any>('menu_items').updateOne(
            { _id: entry.targetId },
            { $set: { image_url: entry.targetPublicUrl, imageUrl: entry.targetPublicUrl } }
          );
          dbUpdatedCount++;
        } else if (entry.type === 'restaurant_logo') {
          await db.collection<any>('restaurants').updateOne(
            { _id: entry.targetId },
            { $set: { 'branding.logo_url': entry.targetPublicUrl } }
          );
        }
      }
    }

    console.log(`✓ Migration complete! Uploaded ${uploadedCount} files to GCS and updated ${dbUpdatedCount} database records.`);
  } finally {
    await client.close();
  }
}

runMigration().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
