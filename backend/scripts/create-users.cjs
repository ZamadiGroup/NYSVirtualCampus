const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to the nys_virtual_campus database (same one Vercel uses)
const MONGODB_URI = 'mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  department: { type: String },
  isGraduated: { type: Boolean, default: false },
  isInvited: { type: Boolean, default: false },
  inviteToken: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const usersToCreate = [
  {
    username: 'masha',
    email: 'masha@gmail.com',
    password: '1234',
    fullName: 'Masha (Facilitator)',
    role: 'tutor',
    department: 'Training',
  },
  {
    username: 'sam',
    email: 'sam@gmail.com',
    password: '1234',
    fullName: 'Sam (Student)',
    role: 'student',
    department: 'General',
  },
];

async function createUsers() {
  try {
    console.log('Connecting to nys_virtual_campus database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    for (const userData of usersToCreate) {
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        console.log(`${userData.email} already exists (role: ${existing.role}). Updating password...`);
        existing.password = await bcrypt.hash(userData.password, 10);
        existing.role = userData.role;
        await existing.save();
        console.log(`  Updated!\n`);
      } else {
        console.log(`Creating ${userData.email} (${userData.role})...`);
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({ ...userData, password: hashedPassword });
        console.log(`  Created!\n`);
      }
    }

    // Verify
    console.log('Verifying logins...');
    for (const userData of usersToCreate) {
      const user = await User.findOne({ email: userData.email });
      const match = await bcrypt.compare(userData.password, user.password);
      console.log(`  ${userData.email} (${user.role}): ${match ? 'OK' : 'FAILED'}`);
    }

    console.log('\nAll users in nys_virtual_campus:');
    const all = await User.find().select('email role fullName');
    all.forEach(u => console.log(`  ${u.email} - ${u.role} - ${u.fullName}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDone.');
  }
}

createUsers();
