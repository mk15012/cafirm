const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const users = {
  ca: { email: 'ramesh@cafirm.com', password: 'password123' },
  manager: { email: 'priya@cafirm.com', password: 'password123' },
  staff1: { email: 'raj@cafirm.com', password: 'password123' },
  staff2: { email: 'anita@cafirm.com', password: 'password123' },
};

async function login(user) {
  const res = await axios.post(`${API_URL}/auth/login`, user);
  return res.data.token;
}

async function run() {
  console.log('🔐 Role-based access checks');

  const tokens = {};
  for (const [role, creds] of Object.entries(users)) {
    try {
      tokens[role] = await login(creds);
      console.log(`✅ Login ${role}`);
    } catch (e) {
      console.error(`❌ Login ${role}:`, e.response?.data || e.message);
      return;
    }
  }

  // Helper to GET with token
  const g = async (role, path) => {
    try {
      const res = await axios.get(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${tokens[role]}` } });
      console.log(`✅ ${role.toUpperCase()} GET ${path} -> ${Array.isArray(res.data) ? res.data.length : 'ok'}`);
      return res.data;
    } catch (e) {
      console.log(`⚠️ ${role.toUpperCase()} GET ${path} blocked:`, e.response?.status, e.response?.data?.error || e.message);
      return null;
    }
  };

  // CA should see everything
  await g('ca', '/clients');
  await g('ca', '/users');
  await g('ca', '/activity-logs');
  await g('ca', '/tasks');

  // Manager: should see users? (likely denied); should see firms/tasks scoped to their team
  await g('manager', '/users');
  const mgrTasks = await g('manager', '/tasks');
  const mgrClients = await g('manager', '/clients');

  // Staff: limited
  await g('staff1', '/users');
  const staffTasks = await g('staff1', '/tasks');
  const staffClients = await g('staff1', '/clients');

  // Visibility sanity: ensure staff tasks are subset of manager tasks when both exist
  if (Array.isArray(mgrTasks) && Array.isArray(staffTasks)) {
    const mgrTaskIds = new Set(mgrTasks.map(t => t.id));
    const staffTaskIds = staffTasks.map(t => t.id);
    const missing = staffTaskIds.filter(id => !mgrTaskIds.has(id));
    if (missing.length === 0) {
      console.log('✅ Staff tasks are within manager scope');
    } else {
      console.log('⚠️ Staff has tasks not visible to manager:', missing);
    }
  }

  if (Array.isArray(mgrClients) && Array.isArray(staffClients)) {
    const mgrClientIds = new Set(mgrClients.map(c => c.id));
    const staffClientIds = staffClients.map(c => c.id);
    const missing = staffClientIds.filter(id => !mgrClientIds.has(id));
    if (missing.length === 0) {
      console.log('✅ Staff clients are within manager scope');
    } else {
      console.log('⚠️ Staff has clients not visible to manager:', missing);
    }
  }

  console.log('Done role checks');
}

run().catch(e => {
  console.error('Fatal:', e.response?.data || e.message);
});
