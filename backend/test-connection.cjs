// Test script to verify MongoDB connection and data (CommonJS)
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nys_virtual_campus';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    
    // Test collections
    const db = mongoose.connection.db;
    
    // Check if collections exist and have data
    const collections = ['users', 'courses', 'enrollments', 'assignments', 'submissions', 'grades', 'announcements'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`📊 ${collectionName}: ${count} documents`);
    }
    
    // Test a specific query
    const users = await db.collection('users').find({}).limit(3).toArray();
    console.log('👥 Sample users:', users.map(u => ({ name: u.fullName, email: u.email, role: u.role })));
    
    const courses = await db.collection('courses').find({}).limit(2).toArray();
    console.log('📚 Sample courses:', courses.map(c => ({ title: c.title, enrollmentKey: c.enrollmentKey })));
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message || error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB();
