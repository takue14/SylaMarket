require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL not found in .env.local');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('Connected. Backfilling product images...\n');

  // Products with a single imageLink but no images array yet
  const withSingleImage = await db.collection('products').updateMany(
    {
      imageLink: { $exists: true, $ne: '' },
      $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
    },
    [{ $set: { images: ['$imageLink'] } }]
  );
  console.log(`Backfilled from single imageLink: ${withSingleImage.modifiedCount}`);

  // Products with neither imageLink nor images at all — give them a
  // placeholder so the required-field validator doesn't block future saves.
  // These should be reviewed manually; a placeholder is a stopgap, not a fix.
  const withNoImageAtAll = await db.collection('products').updateMany(
    {
      $and: [
        { $or: [{ imageLink: { $exists: false } }, { imageLink: '' }] },
        { $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] },
      ],
    },
    { $set: { images: ['/placeholder.png'], imageLink: '/placeholder.png' } }
  );
  console.log(`Given placeholder (had no image at all): ${withNoImageAtAll.modifiedCount}`);

  const remaining = await db.collection('products').countDocuments({
    $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
  });
  console.log(`\nRemaining products still missing images: ${remaining}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});