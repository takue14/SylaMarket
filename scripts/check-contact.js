require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const db = mongoose.connection.db;

  const contact = 'chigwayataku@gmail.com';

  const customer = await db.collection('customers').findOne({ email: contact });
  const seller = await db.collection('sellers').findOne({ contact });
  const deliveryGuy = await db.collection('deliveryguys').findOne({ contact });

  console.log('Customer:', customer ? 'FOUND' : 'not found');
  console.log('Seller:', seller ? 'FOUND' : 'not found');
  console.log('DeliveryGuy:', deliveryGuy ? 'FOUND' : 'not found');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});