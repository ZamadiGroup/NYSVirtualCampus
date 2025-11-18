#!/usr/bin/env node
// List all students via the API
const http = require('http');

const adminEmail = process.argv[2] || 'admin@nys.edu';
const adminPassword = process.argv[3] || 'admin123';

async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: adminEmail,
      password: adminPassword
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.token) {
            resolve(response.token);
          } else {
            reject(new Error(`Login failed: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fetchUsers(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users?role=student',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in as admin...');
    const token = await login();
    console.log('✅ Logged in successfully\n');

    console.log('Fetching students...');
    const students = await fetchUsers(token);

    console.log('\n=== STUDENTS IN DATABASE ===');
    console.log(`Total students: ${students.length}\n`);

    if (students.length === 0) {
      console.log('No students found in the database.');
    } else {
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.fullName}`);
        console.log(`   Email: ${student.email}`);
        console.log(`   Username: ${student.username || 'N/A'}`);
        console.log(`   Department: ${student.department || 'N/A'}`);
        console.log(`   ID: ${student._id}`);
        console.log('');
      });
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
