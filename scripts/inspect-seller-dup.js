require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL not found in .env.local');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const docs = await db.collection('sellers').find({ contact: '123456' }).toArray();

  console.log(`Found ${docs.length} sellers with contact '123456':\n`);
  docs.forEach((doc, i) => {
    console.log(`--- Record ${i + 1} ---`);
    console.log({
      _id: doc._id.toString(),
      name: doc.name,
      businessName: doc.businessName,
      contact: doc.contact,
      createdAt: doc.createdAt,
      hasIdPhoto: !!doc.idPhotoUrl,
      hasLivePhoto: !!doc.livePhotoUrl,
    });
    console.log('');
  });

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Inspect failed:', err);
  process.exit(1);
});