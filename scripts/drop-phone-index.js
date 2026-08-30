require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const indexes = await db.collection('deliveryguys').indexes();
  const hasPhoneIndex = indexes.some((idx) => idx.name === 'phone_1');

  if (hasPhoneIndex) {
    await db.collection('deliveryguys').dropIndex('phone_1');
    console.log('Dropped phone_1 index.');
  } else {
    console.log('No phone_1 index found — nothing to drop.');
  }

  // Also clean up any leftover documents from your earlier failed test
  // registrations, which may have partial/broken data from the collision.
  const nullPhoneOrContact = await db.collection('deliveryguys')
    .find({ $or: [{ phone: null }, { contact: null }] })
    .toArray();
  console.log(`Found ${nullPhoneOrContact.length} documents with null phone/contact:`);
  console.log(nullPhoneOrContact.map((d) => ({ _id: d._id.toString(), name: d.name, contact: d.contact, phone: d.phone })));

  // Ensure the new index exists
  await db.collection('deliveryguys').createIndex({ contact: 1 }, { unique: true });
  console.log('Confirmed contact_1 unique index exists.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});