// Diagnostic script: checkDbAndAdmin.cjs
// Usage:
//   node scripts/checkDbAndAdmin.cjs
//   MONGODB_URI must be set in env or in a .env file
// Optional:
//   node scripts/checkDbAndAdmin.cjs --healthUrl https://your-app.vercel.app

require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch');

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const jwtSecret = process.env.JWT_SECRET;

  console.log('\n== NYS Virtual Campus: DB + Admin diagnostic ==\n');

  if (!mongoUri) {
    console.error('✖ MONGODB_URI is not set in your environment.');
    console.error('  Set MONGODB_URI and re-run. Example:');
    console.error('    MONGODB_URI="mongodb+srv://user:pass@cluster0.mongodb.net/dbname" node scripts/checkDbAndAdmin.cjs\n');
    process.exitCode = 2;
    return;
  }

  console.log('→ Using MONGODB_URI from environment');

  try {
    await mongoose.connect(mongoUri, { connectTimeoutMS: 10000 });
    console.log('✔ Connected to MongoDB');
  } catch (err) {
    console.error('✖ Failed to connect to MongoDB:');
    console.error(err && err.message ? err.message : err);
    process.exitCode = 3;
    return;
  }

  try {
    const usersColl = mongoose.connection.db.collection('users');

    const adminCount = await usersColl.countDocuments({ role: 'admin' });
    console.log(`\nAdmins found: ${adminCount}`);

    if (adminCount > 0) {
      const admins = await usersColl.find({ role: 'admin' }).limit(5).toArray();
      console.log('\nSample admin accounts (up to 5):');
      admins.forEach((a, idx) => {
        const email = a.email || '<no-email>';
        const username = a.username || '<no-username>';
        const fullName = a.fullName || '<no-fullName>';
        const pw = a.password || '';
        const pwLooksHashed = typeof pw === 'string' && pw.startsWith('$2');
        console.log(`  ${idx + 1}. ${email} | ${username} | ${fullName} | passwordHashed: ${pwLooksHashed}`);
      });
    } else {
      console.log('\nNo admin users found.');
    }

    // Check for invited placeholders with inviteToken
    const invitedCount = await usersColl.countDocuments({ isInvited: true });
    console.log(`\nInvited placeholder accounts: ${invitedCount}`);

    // Check some other health indicators
    const userCount = await usersColl.countDocuments();
    const coursesColl = mongoose.connection.db.collection('courses');
    const courseCount = await coursesColl.countDocuments().catch(() => -1);
    console.log(`\nTotal users: ${userCount}`);
    if (courseCount >= 0) console.log(`Total courses: ${courseCount}`);

  } catch (err) {
    console.error('✖ Error while querying collections:', err && err.message ? err.message : err);
  }

  if (jwtSecret) {
    console.log('\n✔ JWT_SECRET is set in environment');
  } else {
    console.warn('\n⚠ JWT_SECRET is NOT set in environment. Tokens will use default secret in code (not secure).');
  }

  // Optional: health URL check
  const args = process.argv.slice(2);
  const healthArgIndex = args.indexOf('--healthUrl');
  if (healthArgIndex !== -1 && args[healthArgIndex + 1]) {
    const url = args[healthArgIndex + 1].replace(/\/+$/, '');
    const healthUrl = `${url}/api/health`;
    console.log(`\n→ Fetching health endpoint: ${healthUrl}`);
    try {
      // node-fetch v2 uses default import; node v18+ has global fetch but we imported node-fetch
      (async () => {
        const res = await fetch(healthUrl, { timeout: 10000 });
        const json = await res.json().catch(() => null);
        console.log('Health response status:', res.status);
        console.log('Health response body:', json);
      })();
    } catch (err) {
      console.error('✖ Failed to fetch health endpoint:', err && err.message ? err.message : err);
    }
  }

  // Disconnect
  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err && err.message ? err.message : err);
  process.exitCode = 99;
});
