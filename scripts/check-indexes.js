require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const indexes = await db.collection('deliveryguys').indexes();
  console.log('Current indexes on deliveryguys:');
  console.log(indexes);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});