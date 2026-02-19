(async () => {
  try {
    const base = 'http://localhost:5000/api';

    // Register tutor
    console.log('Registering tutor...');
    let res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tutor+ci@example.com', password: 'password', fullName: 'CI Tutor', role: 'tutor' }),
    });
    const reg = await res.json();
    console.log('Register response status', res.status);
    if (res.status !== 201) {
      console.log('Register response', reg);
    }

    // Login
    console.log('Logging in...');
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tutor+ci@example.com', password: 'password' }),
    });
    const login = await res.json();
    console.log('Login status', res.status);
    if (!login.token) {
      console.error('Login failed', login);
      process.exit(1);
    }

    const token = login.token;

    // Create course
    console.log('Creating course...');
    res = await fetch(`${base}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'CI Test Course', description: 'Created by smoke test', department: 'Testing' })
    });
    const created = await res.json();
    console.log('Create status', res.status);
    console.log('Created course:', created);

    process.exit(0);
  } catch (err) {
    console.error('Error in smoke test', err);
    process.exit(1);
  }
})();
