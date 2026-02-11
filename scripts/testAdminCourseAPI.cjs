#!/usr/bin/env node
// Test admin course creation via API simulation
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAdminCourseCreation() {
  console.log('🧪 Testing Admin Course Creation Functionality\n');
  
  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nys.com',
        password: 'admin123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error('Login failed. Please check admin credentials.');
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Admin logged in successfully');
    console.log('   User:', loginData.user.fullName);
    console.log('   Role:', loginData.user.role);
    
    // Step 2: Create a new course
    console.log('\nStep 2: Creating a test course...');
    const courseData = {
      title: 'Test Course - ' + new Date().toISOString(),
      description: 'This is a test course created by admin to verify functionality',
      department: 'Technology',
      tags: ['test', 'demo'],
      estimatedDuration: '4 weeks',
      isMandatory: false,
      chapters: [
        {
          title: 'Introduction',
          description: 'Getting started with the course',
          materials: [
            {
              type: 'pdf',
              url: 'https://example.com/intro.pdf',
              label: 'Introduction PDF'
            }
          ]
        }
      ]
    };
    
    const courseRes = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });
    
    if (!courseRes.ok) {
      const error = await courseRes.json();
      throw new Error(`Course creation failed: ${error.error || courseRes.statusText}`);
    }
    
    const createdCourse = await courseRes.json();
    console.log('✅ Course created successfully!');
    console.log('   Course ID:', createdCourse.course._id);
    console.log('   Title:', createdCourse.course.title);
    console.log('   Enrollment Key:', createdCourse.course.enrollmentKey);
    console.log('   Instructor:', createdCourse.course.instructorId?.fullName);
    
    // Step 3: Verify course exists in database
    console.log('\nStep 3: Retrieving created course...');
    const getRes = await fetch(`${API_BASE}/courses/${createdCourse.course._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!getRes.ok) {
      throw new Error('Failed to retrieve course');
    }
    
    const retrievedCourse = await getRes.json();
    console.log('✅ Course retrieved successfully!');
    console.log('   Title:', retrievedCourse.title);
    console.log('   Chapters:', retrievedCourse.chapters?.length || 0);
    
    // Step 4: Get all courses
    console.log('\nStep 4: Fetching all courses...');
    const allCoursesRes = await fetch(`${API_BASE}/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const allCourses = await allCoursesRes.json();
    console.log('✅ Total courses in database:', allCourses.length);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✓ Admin authentication works');
    console.log('✓ Course creation works');
    console.log('✓ Course retrieval works');
    console.log('✓ Database integration works');
    console.log('\n💡 Admin can successfully create and manage courses!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n📝 Note: Make sure the server is running on http://localhost:5000');
    console.error('   Run: npm run dev');
  }
}

testAdminCourseCreation();
