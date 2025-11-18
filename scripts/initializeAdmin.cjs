/**
 * Initialize Admin User
 * This script creates a default admin account with credentials:
 * Email: admin@nys.com
 * Password: admin123
 * 
 * Usage: node scripts/initializeAdmin.cjs
 * Run this once to set up the admin account.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Define User Schema (same as in server/mongodb.ts)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  department: { type: String },
  isGraduated: { type: Boolean, default: false },
  isInvited: { type: Boolean, default: false },
  inviteToken: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const initializeAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable not set');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@nys.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: admin@nys.com');
      console.log('   If you need to reset the password, use the admin settings page in the app.');
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@nys.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin',
      department: 'Administration',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@nys.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  IMPORTANT: Change this password after first login via Admin Settings');

  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

initializeAdmin();
