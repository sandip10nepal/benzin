import { MongoClient } from 'mongodb';
import http from 'http';
import { env } from '../config/env';

async function testMongoSync() {
  console.log('Testing cross-instance MongoDB Atlas real-time sync...');

  // 1. Connect an SSE client to the local server (simulating localhost admin panel)
  const receivedEvents: any[] = [];
  const req = http.request('http://localhost:3000/api/orders/live?restaurant_id=RES_EED4E9D266DF', (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            receivedEvents.push(data);
          } catch (_) {}
        }
      }
    });
  });
  req.end();

  // Wait 1 second for SSE connection to establish
  await new Promise(r => setTimeout(r, 1000));

  // 2. Connect directly to MongoDB Atlas (simulating external production server)
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const db = client.db('benzin_saas_db');

  const testOrderId = `cav-sync-test-${Date.now()}`;
  console.log(`Inserting order ${testOrderId} directly into Atlas (simulating production order)...`);

  await db.collection('orders').insertOne({
    _id: testOrderId as any,
    restaurant_id: 'RES_EED4E9D266DF',
    table_id: '8',
    table: '8',
    customer_name: 'Live Mobile App User',
    customerName: 'Live Mobile App User',
    status: 'pending',
    items: [
      {
        name: 'Blue Mist Hookah',
        category: 'hookah',
        price: 35,
        qty: 1
      }
    ],
    subtotal: 35,
    grand_total: 42.50,
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    fulfilledDepartments: []
  });

  // 3. Wait for Change Stream to pick up and forward to local SSE
  console.log('Waiting for local SSE client to receive real-time event from Atlas...');
  let found = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    const match = receivedEvents.find(e => (e.id === testOrderId || e.orderId === testOrderId || e.order?.id === testOrderId));
    if (match) {
      console.log('🎉 SUCCESS: Local SSE client received event from Atlas in real time!');
      console.log('Event details:', JSON.stringify(match));
      found = true;
      break;
    }
  }

  // Clean up test order
  await db.collection('orders').deleteOne({ _id: testOrderId as any });
  await client.close();
  req.destroy();

  if (!found) {
    console.error('❌ FAILED: Local SSE did not receive order from Change Stream within 5 seconds');
    process.exit(1);
  }

  console.log('✅ MongoDB Atlas cross-instance real-time sync verified 100%!');
  process.exit(0);
}

testMongoSync().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
