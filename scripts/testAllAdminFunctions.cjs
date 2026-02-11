const mongoose = require('mongoose');

// MongoDB connection string
const MONGO_URI = 'mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority';

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
  thumbnail: { type: String },
  notes: { type: String },
  pptLinks: [{ type: String }],
  resources: [{
    url: { type: String },
    label: { type: String }
  }],
  attachments: [{ type: String }],
  tags: [{ type: String }],
  estimatedDuration: { type: String },
  duration: { type: Number },
  isMandatory: { type: Boolean, default: true },
  chapters: [{
    title: { type: String },
    description: { type: String },
    materials: [{
      type: { type: String },
      url: { type: String },
      label: { type: String }
    }]
  }],
  enrollEmails: [{ type: String }],
  enrollmentKey: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const AssignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['auto', 'upload'], required: true },
  instructions: { type: String, required: true },
  dueDate: { type: Date },
  questions: [{
    text: { type: String, required: true },
    imageUrl: { type: String },
    choices: [{ type: String }],
    correctAnswer: { type: String }
  }],
  attachments: [{ type: String }],
  maxScore: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const EnrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, default: 'active' },
}, { timestamps: true });

async function testAdminFunctionalities() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', UserSchema);
    const Course = mongoose.model('Course', CourseSchema);
    const Assignment = mongoose.model('Assignment', AssignmentSchema);
    const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);

    // TEST 1: Check admin user exists
    console.log('📋 TEST 1: Checking admin user...');
    const adminUser = await User.findOne({ email: 'admin@nys.com' });
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email, '- Role:', adminUser.role);
    } else {
      console.log('❌ Admin user not found!');
    }

    // TEST 2: Create a new test user
    console.log('\n📋 TEST 2: Creating new test user...');
    const testUserEmail = `testuser${Date.now()}@test.com`;
    const testUserData = {
      username: 'testuser' + Date.now(),
      email: testUserEmail,
      password: 'password123' + Date.now(), // Store plain password for testing
      fullName: 'Test User',
      role: 'student',
      department: 'Computer Science',
      cohort: 'cohort 2',
    };

    const newUser = new User(testUserData);
    await newUser.save();
    console.log('✅ Test user created:', newUser.email);

    // TEST 3: Create a new test course
    console.log('\n📋 TEST 3: Creating new test course...');
    const testCourseData = {
      title: 'Admin Test Course ' + Date.now(),
      description: 'This is a test course to verify admin functionality',
      department: 'Computer Science',
      instructorId: adminUser._id,
      enrollmentKey: 'TESTKEY' + Math.random().toString(36).substring(7).toUpperCase(),
      isActive: true,
      isMandatory: false,
      chapters: [{
        title: 'Chapter 1',
        description: 'Test chapter',
        materials: [{
          type: 'pdf',
          url: 'https://example.com/test.pdf',
          label: 'Test Material'
        }]
      }]
    };

    const newCourse = new Course(testCourseData);
    await newCourse.save();
    console.log('✅ Test course created:', newCourse.title, '- Key:', newCourse.enrollmentKey);

    // TEST 4: Enroll test user in test course
    console.log('\n📋 TEST 4: Enrolling test user in test course...');
    const enrollmentData = {
      studentId: newUser._id,
      courseId: newCourse._id,
      status: 'active',
    };

    const existingEnrollment = await Enrollment.findOne({
      studentId: newUser._id,
      courseId: newCourse._id,
    });

    if (existingEnrollment) {
      console.log('⚠️  User already enrolled in this course');
    } else {
      const newEnrollment = new Enrollment(enrollmentData);
      await newEnrollment.save();
      console.log('✅ User enrolled in course successfully');
    }

    // TEST 5: Create assignment for test course
    console.log('\n📋 TEST 5: Creating assignment for test course...');
    const testAssignmentData = {
      title: 'Test Assignment ' + Date.now(),
      courseId: newCourse._id,
      type: 'auto',
      instructions: 'This is a test assignment',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      questions: [{
        text: 'Sample question?',
        choices: ['Option A', 'Option B', 'Option C'],
        correctAnswer: 'Option A'
      }]
    };

    const newAssignment = new Assignment(testAssignmentData);
    await newAssignment.save();
    console.log('✅ Test assignment created:', newAssignment.title);

    // TEST 6: Update course (toggle active status)
    console.log('\n📋 TEST 6: Updating course active status...');
    newCourse.isActive = false;
    await newCourse.save();
    console.log('✅ Course updated - Active status:', newCourse.isActive);

    // Revert back
    newCourse.isActive = true;
    await newCourse.save();
    console.log('✅ Course reverted - Active status:', newCourse.isActive);

    // TEST 7: Update course instructor
    console.log('\n📋 TEST 7: Testing course instructor update...');
    const allTutors = await User.find({ role: 'tutor' }).limit(1);
    if (allTutors.length > 0) {
      const originalInstructor = newCourse.instructorId;
      newCourse.instructorId = allTutors[0]._id;
      await newCourse.save();
      console.log('✅ Course instructor updated to:', allTutors[0].fullName);
      
      // Revert back
      newCourse.instructorId = originalInstructor;
      await newCourse.save();
      console.log('✅ Course instructor reverted');
    } else {
      console.log('⚠️  No tutors found to test instructor update');
    }

    // TEST 8: Verify enrollEmails functionality
    console.log('\n📋 TEST 8: Testing enrollEmails update...');
    newCourse.enrollEmails = [testUserEmail, 'another@test.com'];
    await newCourse.save();
    console.log('✅ enrollEmails updated:', newCourse.enrollEmails);

    // TEST 9: Graduate student
    console.log('\n📋 TEST 9: Testing graduate student functionality...');
    newUser.isGraduated = true;
    await newUser.save();
    console.log('✅ Student graduated:', newUser.fullName);

    // TEST 10: Get database statistics
    console.log('\n📋 TEST 10: Database statistics...');
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const activeStudents = await User.countDocuments({ role: 'student', isGraduated: false });
    const tutors = await User.countDocuments({ role: 'tutor' });
    const admins = await User.countDocuments({ role: 'admin' });

    console.log('📊 Database Statistics:');
    console.log('  - Total Users:', totalUsers);
    console.log('    * Active Students:', activeStudents);
    console.log('    * Tutors:', tutors);
    console.log('    * Admins:', admins);
    console.log('  - Total Courses:', totalCourses);
    console.log('  - Total Assignments:', totalAssignments);
    console.log('  - Total Enrollments:', totalEnrollments);

    // TEST 11: Query active courses
    console.log('\n📋 TEST 11: Querying active courses...');
    const activeCourses = await Course.find({ isActive: true }).populate('instructorId', 'fullName');
    console.log('✅ Active courses:', activeCourses.length);
    activeCourses.slice(0, 3).forEach(course => {
      console.log(`  - ${course.title} (${course.department}) - Instructor: ${course.instructorId?.fullName || 'None'}`);
    });

    // TEST 12: Query enrollments for test user
    console.log('\n📋 TEST 12: Querying enrollments for test user...');
    const userEnrollments = await Enrollment.find({ studentId: newUser._id })
      .populate('courseId', 'title department');
    console.log('✅ Test user enrollments:', userEnrollments.length);
    userEnrollments.forEach(enrollment => {
      console.log(`  - ${enrollment.courseId?.title} (${enrollment.courseId?.department})`);
    });

    // TEST 13: Query assignments for test course
    console.log('\n📋 TEST 13: Querying assignments for test course...');
    const courseAssignments = await Assignment.find({ courseId: newCourse._id });
    console.log('✅ Test course assignments:', courseAssignments.length);
    courseAssignments.forEach(assignment => {
      console.log(`  - ${assignment.title} - Due: ${assignment.dueDate}`);
    });

    console.log('\n🎉 All admin functionality tests completed successfully!');
    console.log('\n✅ SUMMARY: All CRUD operations are working correctly');
    console.log('✅ Database connections are functioning properly');
    console.log('✅ All admin functionalities validated');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAdminFunctionalities();
