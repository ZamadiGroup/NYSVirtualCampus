const http = require('http');

const API_BASE = 'http://localhost:5000/api';

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

async function test() {
  try {
    // Login
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'admin@nys.com',
      password: 'admin123'
    });
    
    const token = loginRes.body.token;
    console.log('Logged in\n');

    // Create course
    const courseRes = await makeRequest('POST', '/courses', {
      title: 'Debug Course',
      description: 'Test',
      department: 'Engineering',
      isMandatory: true
    }, token);
    
    console.log('Created course:', courseRes.body.course?._id || courseRes.body._id);
    const courseId = courseRes.body.course?._id || courseRes.body._id;

    // Update course
    const updateRes = await makeRequest('PUT', `/courses/${courseId}`, {
      description: 'Updated description',
      isMandatory: false
    }, token);
    
    console.log('Update response status:', updateRes.status);
    console.log('Update response body:', JSON.stringify(updateRes.body, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

test();
