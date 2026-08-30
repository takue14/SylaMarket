require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const result = await db.collection('sellers').updateOne(
    { _id: new mongoose.Types.ObjectId('PASTE_THE_ID_HERE') },
    { $set: { contact: 'REPLACE_WITH_REAL_PHONE_OR_EMAIL' } }
  );

  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });