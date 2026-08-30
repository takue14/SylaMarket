require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL not found in .env.local');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('Connected. Running migrations...\n');

  // ---- Drop the legacy unique index on `phone` before renaming the field ----
  const deliveryIndexes = await db.collection('deliveryguys').indexes();
  const hasPhoneIndex = deliveryIndexes.some((idx) => idx.name === 'phone_1');
  if (hasPhoneIndex) {
    console.log('Dropping legacy phone_1 unique index...');
    await db.collection('deliveryguys').dropIndex('phone_1');
  }

  // ---- Delivery guys: rename phone -> contact, grandfather as approved ----
  const deliveryResult = await db.collection('deliveryguys').updateMany(
    { phone: { $exists: true }, contact: { $exists: false } },
    [
      { $set: { contact: '$phone', contactVerified: true, verificationStatus: 'approved' } },
      { $unset: 'phone' },
    ]
  );
  console.log(`Delivery guys migrated: ${deliveryResult.modifiedCount}`);

  // ---- Create the new unique index on `contact` to match the new schema ----
  console.log('Creating contact_1 unique index...');
  await db.collection('deliveryguys').createIndex({ contact: 1 }, { unique: true });

  // ---- Sellers: backfill missing verification fields, grandfather as approved ----
  const sellerResult = await db.collection('sellers').updateMany(
    { contactVerified: { $exists: false } },
    {
      $set: {
        contactVerified: true,
        verificationStatus: 'approved',
      },
    }
  );
  console.log(`Sellers migrated: ${sellerResult.modifiedCount}`);

  console.log('\nDone.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});