#!/usr/bin/env node
// Create a user for testing (CJS version so it runs even when package.json sets "type": "module").
// Usage: node scripts/createUser.cjs <role> <email> <password> "Full Name"
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nys';

const role = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const fullName = process.argv[5] || 'Test User';

if (!role || !email || !password) {
  console.error('Usage: node scripts/createUser.cjs <role> <email> <password> "Full Name"');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGODB_URI);

  const bcrypt = require('bcrypt');
  const userSchema = new mongoose.Schema({ username: String, password: String, email: String, fullName: String, role: String }, { timestamps: true });
  const User = mongoose.model('User_createUserScript', userSchema, 'users');

  const username = email.includes('@') ? email.split('@')[0] : email;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('User already exists:', existing.email, 'role:', existing.role);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const u = new User({ username, email, password: hashed, fullName, role });
  await u.save();
  console.log('Created user', email, 'with role', role);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
