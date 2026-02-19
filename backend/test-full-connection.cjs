// Comprehensive test script for backend and database connectivity
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

console.log('🧪 Starting comprehensive connection tests...\n');

// Test 1: Environment variables
console.log('=== Test 1: Environment Variables ===');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  console.log('✅ MONGODB_URI is set');
  // Mask the password in the URI for security
  const maskedUri = mongoUri.replace(/:[^:@]+@/, ':****@');
  console.log('   URI (masked):', maskedUri);
} else {
  console.log('❌ MONGODB_URI is not set');
}
console.log('');

// Test 2: MongoDB Connection
async function testMongoConnection() {
  console.log('=== Test 2: MongoDB Connection ===');
  try {
    if (!mongoUri) {
      console.log('❌ Cannot test MongoDB - URI not configured');
      return false;
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connection successful!');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📦 Database has ${collections.length} collections:`);
    
    // Check document counts in each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }
    
    // Test specific collections with sample data
    console.log('\n📊 Sample Data:');
    
    // Users
    const users = await db.collection('users').find({}).limit(3).toArray();
    if (users.length > 0) {
      console.log('\n👥 Sample Users:');
      users.forEach(u => {
        console.log(`   - ${u.fullName || u.username} (${u.email}) - Role: ${u.role}`);
      });
    }
    
    // Courses
    const courses = await db.collection('courses').find({}).limit(3).toArray();
    if (courses.length > 0) {
      console.log('\n📚 Sample Courses:');
      courses.forEach(c => {
        console.log(`   - ${c.title} (${c.department})`);
      });
    }
    
    // Assignments
    const assignments = await db.collection('assignments').find({}).limit(3).toArray();
    if (assignments.length > 0) {
      console.log('\n📝 Sample Assignments:');
      assignments.forEach(a => {
        console.log(`   - ${a.title} (Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'})`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    return false;
  }
}

// Test 3: Backend Server (if running)
function testBackendServer() {
  return new Promise((resolve) => {
    console.log('\n=== Test 3: Backend Server ===');
    console.log('🔗 Checking if backend server is running on http://localhost:5000...');
    
    const req = http.get('http://localhost:5000/api/health', (res) => {
      console.log(`✅ Backend server is running (Status: ${res.statusCode})`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('   Response:', parsed);
        } catch (e) {
          console.log('   Response:', data);
        }
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log('⚠️  Backend server is not running');
      console.log('   Tip: Start the server with: npm run dev');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log('⚠️  Backend server connection timeout');
      resolve(false);
    });
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testMongoConnection();
    await testBackendServer();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Connection tests completed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

runAllTests();
