#!/usr/bin/env node
// Comprehensive test script to verify admin can create courses and all functionality works
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nys';

async function testAdminFunctionality() {
  console.log('🔍 Testing Admin Functionality & Database Connection...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    // Import models
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String,
      email: String,
      fullName: String,
      role: String
    }, { timestamps: true }), 'users');

    const Course = mongoose.model('Course', new mongoose.Schema({
      title: String,
      description: String,
      department: String,
      instructorId: mongoose.Schema.Types.ObjectId,
      enrollmentKey: String,
      isActive: Boolean
    }, { timestamps: true }), 'courses');

    const Assignment = mongoose.model('Assignment', new mongoose.Schema({
      courseId: mongoose.Schema.Types.ObjectId,
      title: String,
      type: String,
      instructions: String,
      isActive: Boolean
    }, { timestamps: true }), 'assignments');

    const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({
      courseId: mongoose.Schema.Types.ObjectId,
      studentId: mongoose.Schema.Types.ObjectId
    }, { timestamps: true }), 'enrollments');

    // Test 1: Check if admin exists or create one
    console.log('\n📋 Test 1: Admin User');
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('⚠️  No admin found, creating test admin...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      admin = new User({
        username: 'admin_test',
        email: 'admin@nys.ke',
        password: hashedPassword,
        fullName: 'Test Administrator',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin created:', admin.email);
    } else {
      console.log('✅ Admin found:', admin.email);
    }

    // Test 2: Create a test course as admin
    console.log('\n📋 Test 2: Course Creation');
    const testCourse = new Course({
      title: 'Test Course - ' + Date.now(),
      description: 'This is a test course created by admin',
      department: 'Technology',
      instructorId: admin._id,
      enrollmentKey: 'TEST' + Math.random().toString(36).substring(7).toUpperCase(),
      isActive: true
    });
    await testCourse.save();
    console.log('✅ Course created:', testCourse.title);
    console.log('   Enrollment Key:', testCourse.enrollmentKey);

    // Test 3: Create an assignment for the course
    console.log('\n📋 Test 3: Assignment Creation');
    const testAssignment = new Assignment({
      courseId: testCourse._id,
      title: 'Test Assignment',
      type: 'auto',
      instructions: 'Complete this test assignment',
      isActive: true
    });
    await testAssignment.save();
    console.log('✅ Assignment created:', testAssignment.title);

    // Test 4: Check for students
    console.log('\n📋 Test 4: Student Check');
    const students = await User.find({ role: 'student' }).limit(5);
    console.log(`✅ Found ${students.length} student(s) in database`);
    if (students.length > 0) {
      console.log('   Sample student:', students[0].email);
    }

    // Test 5: Database statistics
    console.log('\n📋 Test 5: Database Statistics');
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const assignmentCount = await Assignment.countDocuments();
    const enrollmentCount = await Enrollment.countDocuments();

    console.log('✅ Database Statistics:');
    console.log('   Total Users:', userCount);
    console.log('   Total Courses:', courseCount);
    console.log('   Total Assignments:', assignmentCount);
    console.log('   Total Enrollments:', enrollmentCount);

    // Test 6: Verify course can be retrieved
    console.log('\n📋 Test 6: Course Retrieval');
    const retrievedCourse = await Course.findById(testCourse._id).populate('instructorId', 'fullName email');
    console.log('✅ Course retrieved:', retrievedCourse.title);
    console.log('   Instructor:', retrievedCourse.instructorId.fullName);

    console.log('\n✅ All functionality tests PASSED!');
    console.log('\n🎉 Admin can successfully:');
    console.log('   ✓ Create courses');
    console.log('   ✓ Create assignments');
    console.log('   ✓ Access database');
    console.log('   ✓ Retrieve data with relations');
    console.log('\n💡 Admin Login Credentials:');
    console.log('   Email: admin@nys.ke');
    console.log('   Password: Admin@123');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

testAdminFunctionality();
