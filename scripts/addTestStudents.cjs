#!/usr/bin/env node
// Add test students to the database via API
const http = require('http');

// Sample students to add
const testStudents = [
  {
    fullName: "Emily Johnson",
    email: "emily.johnson@student.nys.edu",
    username: "emily.johnson",
    password: "password123",
    role: "student",
    department: "Culinary Arts"
  },
  {
    fullName: "Michael Chen",
    email: "michael.chen@student.nys.edu",
    username: "michael.chen",
    password: "password123",
    role: "student",
    department: "Hospitality Management"
  },
  {
    fullName: "Sarah Williams",
    email: "sarah.williams@student.nys.edu",
    username: "sarah.williams",
    password: "password123",
    role: "student",
    department: "Food and Beverage"
  },
  {
    fullName: "David Martinez",
    email: "david.martinez@student.nys.edu",
    username: "david.martinez",
    password: "password123",
    role: "student",
    department: "Baking and Pastry"
  },
  {
    fullName: "Jessica Brown",
    email: "jessica.brown@student.nys.edu",
    username: "jessica.brown",
    password: "password123",
    role: "student",
    department: "Culinary Arts"
  }
];

const adminEmail = process.argv[2] || 'admin@nys.edu';
const adminPassword = process.argv[3] || 'password';

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

async function createStudent(token, student) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(student);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(response);
          } else {
            reject(new Error(`Failed to create student: ${data}`));
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

async function run() {
  try {
    console.log(`Logging in as admin (${adminEmail})...`);
    const token = await login();
    console.log('✅ Logged in successfully\n');

    console.log(`Adding ${testStudents.length} test students...\n`);

    for (const student of testStudents) {
      try {
        await createStudent(token, student);
        console.log(`✅ Created: ${student.fullName} (${student.email})`);
      } catch (err) {
        console.log(`⚠️  ${student.fullName}: ${err.message}`);
      }
    }

    console.log('\n✅ Done! Test students have been added.');
    console.log('\nYou can now view them in the Admin Dashboard under Users > Students filter.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nUsage: node scripts/addTestStudents.cjs [admin-email] [admin-password]');
    console.error('Example: node scripts/addTestStudents.cjs admin@nys.edu password');
    process.exit(1);
  }
}

run();
