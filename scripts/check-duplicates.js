require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL not found in .env.local');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const dups = await db
    .collection('deliveryguys')
    .aggregate([
      { $group: { _id: '$phone', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  console.log('Duplicate phone values in deliveryguys:');
  console.log(dups);

  const sellerDups = await db
    .collection('sellers')
    .aggregate([
      { $group: { _id: '$contact', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  console.log('\nDuplicate contact values in sellers:');
  console.log(sellerDups);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});