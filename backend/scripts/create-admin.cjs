const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// User Schema
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

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@nys.com' });

    if (existingAdmin) {
      console.log('👤 Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Username:', existingAdmin.username);
      console.log('   Role:', existingAdmin.role);
      console.log('   Full Name:', existingAdmin.fullName);

      // Update password to ensure it's properly hashed
      console.log('\n🔐 Updating admin password...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Password updated successfully!');

    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');

      const hashedPassword = await bcrypt.hash('admin123', 10);

      const adminUser = new User({
        username: 'admin',
        email: 'admin@nys.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        department: 'Administration',
        isGraduated: false
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    // Display final credentials
    console.log('\n📋 Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@nys.com');
    console.log('Password: admin123');
    console.log('Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test login verification
    console.log('🧪 Testing login verification...');
    const testUser = await User.findOne({ email: 'admin@nys.com' });
    const passwordMatches = await bcrypt.compare('admin123', testUser.password);

    if (passwordMatches) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }

    // List all users in database
    console.log('\n📊 All users in database:');
    const allUsers = await User.find().select('username email role fullName');
    console.table(allUsers.map(u => ({
      Username: u.username,
      Email: u.email,
      Role: u.role,
      'Full Name': u.fullName
    })));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - user might already exist with different details');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();
