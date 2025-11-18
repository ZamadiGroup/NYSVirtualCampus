#!/usr/bin/env node
// List all students from the database
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nys';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to', MONGODB_URI);

    const userSchema = new mongoose.Schema({ 
      username: String, 
      password: String, 
      email: String, 
      fullName: String, 
      role: String,
      department: String 
    }, { timestamps: true });
    
    const User = mongoose.model('User_listStudents', userSchema, 'users');

    const students = await User.find({ role: 'student' }).select('-password');
    
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
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
