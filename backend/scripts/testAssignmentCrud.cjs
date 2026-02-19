#!/usr/bin/env node
/**
 * Simple integration test script for Assignment CRUD against a running local server.
 * Usage (PowerShell):
 * $env:BASE_URL = 'http://localhost:5000';
 * $env:TOKEN = '<JWT_TOKEN_WITH_TUTOR_OR_ADMIN_ROLE>';
 * $env:COURSE_ID = '<EXISTING_COURSE_ID>';
 * node scripts/testAssignmentCrud.cjs
 *
 * The script will create an assignment, fetch assignments for the course,
 * update the created assignment, then delete it. Exit code 0 means success.
 */

(async () => {
  try {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    const TOKEN = process.env.TOKEN;
    const COURSE_ID = process.env.COURSE_ID;

    if (!TOKEN) {
      console.error('ERROR: TOKEN environment variable is required (a tutor/admin JWT).');
      process.exit(2);
    }
    if (!COURSE_ID) {
      console.error('ERROR: COURSE_ID environment variable is required (an existing course id).');
      process.exit(2);
    }

    // Ensure fetch is available (Node 18+); fallback to node-fetch if not present.
    let fetchFn = global.fetch;
    if (!fetchFn) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeFetch = require('node-fetch');
        fetchFn = nodeFetch;
      } catch (e) {
        console.error('Node global fetch is not available and node-fetch is not installed. Please run `npm i node-fetch` or upgrade to Node 18+');
        process.exit(3);
      }
    }

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

    console.log('1) Creating assignment...');
    const createBody = {
      courseId: COURSE_ID,
      title: `Integration Test Assignment ${Date.now()}`,
      type: 'upload',
      instructions: 'This assignment was created by an integration test script.',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      questions: [],
      maxScore: 100
    };

    let res = await fetchFn(`${BASE_URL}/api/assignments`, { method: 'POST', headers, body: JSON.stringify(createBody) });
    if (!res.ok) throw new Error(`Create failed: ${res.status} ${await res.text()}`);
    const created = await res.json();
    const assignmentId = created.id || created._id;
    console.log('  Created assignment id=', assignmentId);

    console.log('2) Fetching assignments for course...');
    res = await fetchFn(`${BASE_URL}/api/assignments?courseId=${encodeURIComponent(COURSE_ID)}`, { headers });
    if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
    const list = await res.json();
    console.log(`  Found ${Array.isArray(list) ? list.length : 0} assignments for course ${COURSE_ID}`);

    console.log('3) Updating assignment title...');
    const updateBody = { title: `Updated Test Assignment ${Date.now()}` };
    res = await fetchFn(`${BASE_URL}/api/assignments/${assignmentId}`, { method: 'PUT', headers, body: JSON.stringify(updateBody) });
    if (!res.ok) throw new Error(`Update failed: ${res.status} ${await res.text()}`);
    const updated = await res.json();
    console.log('  Updated title ->', updated.title || updateBody.title);

    console.log('4) Deleting assignment...');
    res = await fetchFn(`${BASE_URL}/api/assignments/${assignmentId}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
    const deleted = await res.json();
    console.log('  Delete result:', deleted);

    console.log('\nIntegration test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Integration test failed:', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
