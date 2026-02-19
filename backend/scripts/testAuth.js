(async () => {
  try {
    const base = 'http://localhost:5000/api';

    console.log('1) Attempting to create a course without a token (should fail)');
    let res = await fetch(`${base}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Course', department: 'None' }),
    });
    console.log('Create without token status:', res.status);
    try { console.log('Body:', await res.json()); } catch(_) { console.log('No JSON body'); }

    console.log('\n2) Attempt to register an admin via public register (should be rejected)');
    res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin+ci@example.com', password: 'password', fullName: 'CI Admin', role: 'admin' }),
    });
    console.log('Register admin status:', res.status);
    console.log('Body:', await res.json());

    console.log('\n3) Attempt to login with wrong password (should fail)');
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tutor+ci@example.com', password: 'wrong-password' }),
    });
    console.log('Login wrong password status:', res.status);
    console.log('Body:', await res.json());

    console.log('\n4) Login with correct credentials (should succeed)');
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tutor+ci@example.com', password: 'password' }),
    });
    const login = await res.json();
    console.log('Login status:', res.status);
    console.log('Body:', login);
    if (!login.token) {
      console.error('No token returned; aborting further tests');
      process.exit(1);
    }
    const token = login.token;

    console.log('\n5) Attempt to create a course with token (should succeed)');
    res = await fetch(`${base}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'Authorized Course', department: 'Testing' }),
    });
    console.log('Create with token status:', res.status);
    console.log('Body:', await res.json());

    console.log('\nAuth tests completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error running auth tests', err);
    process.exit(1);
  }
})();
