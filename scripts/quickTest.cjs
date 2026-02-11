#!/usr/bin/env node
// Simple test to verify database connection and admin functionality
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority';

async function quickTest() {
  console.log('Testing Database Connection...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    console.log('Database:', mongoose.connection.name);
    
    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Available Collections:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Count documents
    const User = mongoose.connection.collection('users');
    const Course = mongoose.connection.collection('courses');
    
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    
    console.log('\n📈 Document Counts:');
    console.log('  Users:', userCount);
    console.log('  Courses:', courseCount);
    
    // Check for admin
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('\n👤 Admin User Found:');
      console.log('  Email:', adminUser.email);
      console.log('  Name:', adminUser.fullName);
    } else {
      console.log('\n⚠️  No admin user found. Create one using:');
      console.log('  node scripts/createUser.cjs admin admin@nys.ke Admin@123 "Admin User"');
    }
    
    console.log('\n✅ Database is connected and working!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

quickTest().catch(console.error);
