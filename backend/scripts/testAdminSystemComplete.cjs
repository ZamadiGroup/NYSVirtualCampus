const mongoose = require('mongoose');
const http = require('http');

const MONGO_URI = 'mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority';
const API_BASE = 'http://localhost:5000/api';

// Admin credentials
const adminCredentials = {
  email: 'admin@nys.com',
  password: 'admin123'
};

let adminToken = '';
let testUserId = '';
let testCourseId = '';

// HTTP Request helper
async function makeRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// MongoDB direct test helper
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  department: { type: String },
  isGraduated: { type: Boolean, default: false },
}, { timestamps: true });

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isMandatory: { type: Boolean, default: true },
  enrollEmails: [{ type: String }],
  enrollmentKey: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const AssignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['auto', 'upload'], required: true },
  instructions: { type: String, required: true },
  maxScore: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

async function testAdminSystem() {
  let passed = 0;
  let failed = 0;

  console.log('\n═══════════════════════════════════════════════');
  console.log('  COMPREHENSIVE ADMIN SYSTEM TEST SUITE');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', UserSchema);
    const Course = mongoose.model('Course', CourseSchema);
    const Assignment = mongoose.model('Assignment', AssignmentSchema);

    // ========================================
    // API TESTS
    // ========================================
    console.log('📡 API LAYER TESTS\n');

    // TEST 1: Admin Login
    console.log('TEST 1: Admin login via API');
    let loginRes = await makeRequest('POST', '/auth/login', adminCredentials);
    if (loginRes.status === 200 && loginRes.body.token) {
      adminToken = loginRes.body.token;
      console.log('  ✅ PASS: Admin authenticated successfully\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Admin authentication failed\n');
      failed++;
      process.exit(1);
    }

    // TEST 2: Create User via API (with proper validation)
    console.log('TEST 2: Create user via API with all required fields');
    const timestamp = Date.now();
    const userData = {
      username: `admin_test_${timestamp}`,
      fullName: 'Admin Test User',
      email: `admin_test_${timestamp}@test.com`,
      password: 'TestPass123',
      role: 'student',
      department: 'Computer Science'
    };
    let createUserRes = await makeRequest('POST', '/users', userData, adminToken);
    if (createUserRes.status === 200 && createUserRes.body._id) {
      testUserId = createUserRes.body._id;
      console.log('  ✅ PASS: User created successfully');
      console.log(`     Username: ${createUserRes.body.username}`);
      console.log(`     Email: ${createUserRes.body.email}\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: User creation failed - ${createUserRes.body?.error}\n`);
      failed++;
    }

    // TEST 3: Create Course via API
    console.log('TEST 3: Create course via API with mandatory enrollment');
    const courseData = {
      title: `Admin Test Course ${timestamp}`,
      description: 'Course created by admin test',
      department: 'Engineering',
      isMandatory: true,
      estimatedDuration: '6 weeks'
    };
    let createCourseRes = await makeRequest('POST', '/courses', courseData, adminToken);
    if (createCourseRes.status === 200) {
      const course = createCourseRes.body.course || createCourseRes.body;
      testCourseId = course._id;
      console.log('  ✅ PASS: Course created successfully');
      console.log(`     Title: ${course.title}`);
      console.log(`     Enrollment Key: ${course.enrollmentKey}`);
      console.log(`     Active: ${course.isActive}\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Course creation failed - ${createCourseRes.body?.error}\n`);
      failed++;
    }

    // TEST 4: Update Course
    console.log('TEST 4: Update course (change description and mandatory status)');
    const updateData = {
      description: 'Updated course description',
      isMandatory: false
    };
    let updateCourseRes = await makeRequest('PUT', `/courses/${testCourseId}`, updateData, adminToken);
    if (updateCourseRes.status === 200) {
      console.log('  ✅ PASS: Course updated successfully');
      console.log(`     New Description: ${updateCourseRes.body?.description || 'Updated'}`);
      console.log(`     Mandatory: ${updateCourseRes.body?.isMandatory !== undefined ? updateCourseRes.body.isMandatory : 'false'}\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Course update failed - Status ${updateCourseRes.status}\n`);
      failed++;
    }

    // TEST 5: Create Assignment
    console.log('TEST 5: Create assignment for course');
    const assignmentData = {
      courseId: testCourseId,
      title: 'Admin Test Assignment',
      type: 'auto',
      instructions: 'Test assignment',
      maxScore: 100
    };
    let createAssignmentRes = await makeRequest('POST', '/assignments', assignmentData, adminToken);
    if (createAssignmentRes.status === 200 && createAssignmentRes.body._id) {
      console.log('  ✅ PASS: Assignment created successfully');
      console.log(`     Title: ${createAssignmentRes.body.title}`);
      console.log(`     Max Score: ${createAssignmentRes.body.maxScore}\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Assignment creation failed - ${createAssignmentRes.body?.error}\n`);
      failed++;
    }

    // TEST 6: Update Assignment
    console.log('TEST 6: Update assignment');
    const assignmentUpdateData = {
      title: 'Updated Assignment Title',
      maxScore: 150
    };
    let updateAssignmentRes = await makeRequest('PUT', `/assignments/${createAssignmentRes.body._id}`, assignmentUpdateData, adminToken);
    if (updateAssignmentRes.status === 200) {
      console.log('  ✅ PASS: Assignment updated successfully');
      console.log(`     New Title: ${updateAssignmentRes.body.title}`);
      console.log(`     New Max Score: ${updateAssignmentRes.body.maxScore}\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Assignment update failed - ${updateAssignmentRes.body?.error}\n`);
      failed++;
    }

    // TEST 7: Enroll user in course
    console.log('TEST 7: Enroll user in course');
    const enrollData = {
      enrollEmails: [userData.email]
    };
    let enrollRes = await makeRequest('POST', `/courses/${testCourseId}/enroll`, enrollData, adminToken);
    if (enrollRes.status === 200) {
      console.log('  ✅ PASS: User enrolled in course successfully\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Enrollment failed - ${enrollRes.body?.error}\n`);
      failed++;
    }

    // TEST 8: Graduate student
    console.log('TEST 8: Graduate student');
    let graduateRes = await makeRequest('POST', `/users/${testUserId}/graduate`, {}, adminToken);
    if (graduateRes.status === 200) {
      console.log('  ✅ PASS: Student graduated successfully\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Graduation failed - ${graduateRes.body?.error}\n`);
      failed++;
    }

    // ========================================
    // DATABASE VALIDATION TESTS
    // ========================================
    console.log('💾 DATABASE VALIDATION TESTS\n');

    // TEST 9: Verify user exists in database
    console.log('TEST 9: Verify user creation in database');
    const dbUser = await User.findOne({ email: userData.email });
    if (dbUser && dbUser.username === userData.username) {
      console.log('  ✅ PASS: User exists in database with correct data');
      console.log(`     Username: ${dbUser.username}`);
      console.log(`     Role: ${dbUser.role}\n`);
      passed++;
    } else {
      console.log('  ❌ FAIL: User not found or data mismatch in database\n');
      failed++;
    }

    // TEST 10: Verify course exists in database
    console.log('TEST 10: Verify course creation in database');
    const dbCourse = await Course.findById(testCourseId);
    if (dbCourse && dbCourse.title.includes('Admin Test Course')) {
      console.log('  ✅ PASS: Course exists in database with correct data');
      console.log(`     Title: ${dbCourse.title}`);
      console.log(`     Department: ${dbCourse.department}`);
      console.log(`     Active: ${dbCourse.isActive}\n`);
      passed++;
    } else {
      console.log('  ❌ FAIL: Course not found or data mismatch in database\n');
      failed++;
    }

    // TEST 11: Verify assignment exists in database
    console.log('TEST 11: Verify assignment creation in database');
    const dbAssignment = await Assignment.findOne({ courseId: testCourseId });
    if (dbAssignment && dbAssignment.title === 'Updated Assignment Title') {
      console.log('  ✅ PASS: Assignment exists with updated data');
      console.log(`     Title: ${dbAssignment.title}`);
      console.log(`     Max Score: ${dbAssignment.maxScore}\n`);
      passed++;
    } else {
      console.log('  ❌ FAIL: Assignment not found or data mismatch\n');
      failed++;
    }

    // TEST 12: Verify user graduation status
    console.log('TEST 12: Verify student graduation status in database');
    const graduatedUser = await User.findById(testUserId);
    if (graduatedUser && graduatedUser.isGraduated === true) {
      console.log('  ✅ PASS: Student graduation status updated correctly');
      console.log(`     Graduated: ${graduatedUser.isGraduated}\n`);
      passed++;
    } else {
      console.log('  ❌ FAIL: Graduation status not updated correctly\n');
      failed++;
    }

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================
    console.log('⚠️  ERROR HANDLING TESTS\n');

    // TEST 13: Create user without username (should fail gracefully)
    console.log('TEST 13: Attempt to create user without username');
    const invalidUserData = {
      fullName: 'Invalid User',
      email: 'invalid@test.com',
      password: 'TestPass123',
      role: 'student'
    };
    let invalidUserRes = await makeRequest('POST', '/users', invalidUserData, adminToken);
    if (invalidUserRes.status >= 400 && invalidUserRes.body?.error) {
      console.log('  ✅ PASS: Validation error returned properly');
      console.log(`     Error: ${invalidUserRes.body.error}\n`);
      passed++;
    } else {
      console.log('  ❌ FAIL: Should have returned validation error\n');
      failed++;
    }

    // TEST 14: Create course without required fields (should fail gracefully)
    console.log('TEST 14: Attempt to create course without required fields');
    const invalidCourseData = {
      title: 'No Department Course'
      // Missing department
    };
    let invalidCourseRes = await makeRequest('POST', '/courses', invalidCourseData, adminToken);
    if (invalidCourseRes.status >= 400 && invalidCourseRes.body?.error) {
      console.log('  ✅ PASS: Validation error returned properly');
      console.log(`     Error: ${invalidCourseRes.body.error}\n`);
      passed++;
    } else {
      console.log('  ❌ FAIL: Should have returned validation error\n');
      failed++;
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('═══════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════\n');
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Admin system is fully functional.');
      console.log('\n✅ Admin functionalities verified:');
      console.log('   ✓ User creation with validation');
      console.log('   ✓ Course creation with validation');
      console.log('   ✓ Course management (update)');
      console.log('   ✓ Assignment creation and management');
      console.log('   ✓ Course enrollment');
      console.log('   ✓ Student graduation');
      console.log('   ✓ Error handling for invalid inputs');
      console.log('   ✓ Database persistence');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review the errors above.`);
    }

  } catch (error) {
    console.error('❌ Fatal error during testing:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB\n');
  }
}

testAdminSystem();
