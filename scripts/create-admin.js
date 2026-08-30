require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGO_URL;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    throw new Error('Usage: node scripts/create-admin.js email password "Name"');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const existing = await db.collection('admins').findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new Error('An admin with this email already exists.');
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.collection('admins').insertOne({
    email: email.toLowerCase().trim(),
    password: hashed,
    name,
    createdAt: new Date(),
  });

  console.log(`Admin account created for ${email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});