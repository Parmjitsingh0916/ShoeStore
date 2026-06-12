require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/user');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const existing = await User.findOne({ email: 'admin@shoestore.com' });
    if (existing) {
      console.log('✅ Admin already exists!');
      console.log('Email:    admin@shoestore.com');
      console.log('Password: Admin2025!');
      process.exit(0);
    }

    const hashed = await bcrypt.hash('Admin2025!', 10);
    const admin  = new User({
      name:     'Admin',
      email:    'admin@shoestore.com',
      password: hashed,
      role:     'admin'
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('Email:    admin@shoestore.com');
    console.log('Password: Admin2025!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });