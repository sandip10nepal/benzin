import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

async function syncVibeQuest() {
  if (!MONGODB_URI) {
    console.log('No MONGODB_URI found, skipping mongo sync.');
    return;
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const localDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../../multi_tenant_db.json'), 'utf8'));

    for (const rest of localDb.restaurants || []) {
      if (rest.settings?.vibe_quest) {
        await db.collection('restaurants').updateOne(
          { _id: rest._id },
          { 
            $set: { 
              'settings.vibe_quest': rest.settings.vibe_quest,
              branding: rest.branding
            } 
          }
        );
        console.log(`Updated restaurant ${rest.name} (${rest._id}) vibe_quest and branding in MongoDB Atlas.`);
      }
    }
  } catch (err: any) {
    console.error('Mongo sync error:', err.message);
  } finally {
    await client.close();
  }
}

syncVibeQuest();
