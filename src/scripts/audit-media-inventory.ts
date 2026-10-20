import { MongoClient } from 'mongodb';
import { env } from '../config/env';

async function auditMediaDb() {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('benzin_saas_db');

    // 1. Restaurants
    const restaurants = await db.collection('restaurants').find({}).toArray();
    console.log('=== RESTAURANTS IN MONGODB ===');
    console.log(`Found ${restaurants.length} restaurants:`);
    for (const r of restaurants) {
      console.log(`ID: ${r._id || r.id}, Name: ${r.name}, Slug: ${r.slug || 'N/A'}, Logo: ${r.logo_url || r.logo || 'NONE'}, Theme: ${JSON.stringify(r.theme || r.theme_config || 'NONE')}`);
    }

    // 2. Menu Items
    const menuItems = await db.collection('menu_items').find({}).toArray();
    console.log('\n=== MENU ITEMS IN MONGODB ===');
    console.log(`Total menu items: ${menuItems.length}`);

    let localImagesCount = 0;
    let externalImagesCount = 0;
    let noImagesCount = 0;
    const externalUrls: string[] = [];
    const localPaths: Set<string> = new Set();

    for (const item of menuItems) {
      const img = item.image_url || (item as any).imageUrl || (item as any).image;
      if (!img) {
        noImagesCount++;
      } else if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
        externalImagesCount++;
        externalUrls.push(img);
      } else if (typeof img === 'string') {
        localImagesCount++;
        localPaths.add(img);
      }
    }

    console.log(`- Items with local image paths: ${localImagesCount}`);
    console.log(`- Items with external image URLs: ${externalImagesCount}`);
    console.log(`- Items with no image: ${noImagesCount}`);
    console.log(`- Distinct local image paths: ${localPaths.size}`);

    console.log('\nSample local paths (first 10):');
    Array.from(localPaths).slice(0, 10).forEach(p => console.log('  ', p));

    if (externalUrls.length > 0) {
      console.log(`\nSample external URLs (total ${externalUrls.length}, first 5):`);
      externalUrls.slice(0, 5).forEach(u => console.log('  ', u));
    }

    // 3. Media collection?
    const collections = await db.listCollections().toArray();
    const colNames = collections.map((c: any) => c.name);
    console.log('\n=== ALL COLLECTIONS IN benzin_saas_db ===');
    console.log(colNames.join(', '));

    const hasMediaCol = colNames.includes('media') || colNames.includes('restaurant_media');
    console.log(`Has dedicated media collection: ${hasMediaCol}`);
    if (hasMediaCol) {
      const mediaDocs = await db.collection('media').find({}).toArray();
      console.log(`Media collection count: ${mediaDocs.length}`);
    }

  } finally {
    await client.close();
  }
}

auditMediaDb().catch(err => {
  console.error('Error auditing DB:', err);
  process.exit(1);
});
