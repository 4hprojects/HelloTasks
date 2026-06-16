require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.globalRole === 'super_admin') {
      console.log(`Super Admin already exists: ${email}`);
    } else {
      await User.updateOne({ email }, { globalRole: 'super_admin', accountStatus: 'active' });
      console.log(`Existing user promoted to Super Admin: ${email}`);
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    fullName: 'Super Admin',
    email,
    passwordHash,
    globalRole: 'super_admin',
    accountStatus: 'active'
  });

  console.log(`Super Admin created: ${email}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
