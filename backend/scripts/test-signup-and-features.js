const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addTestResult(name, passed, error = null) {
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
    log(`✅ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${name}: ${error}`, 'red');
  }
}

async function testSignup() {
  log('\n📝 Testing Signup Feature...', 'blue');
  
  try {
    // Test 1: Valid signup
    const signupEmail = `testca${Date.now()}@example.com`;
    const signupResponse = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Test CA User',
      email: signupEmail,
      password: 'testpass123',
      phone: '+91-9876543210',
    });
    
    if (signupResponse.status === 201 && signupResponse.data.token && signupResponse.data.user) {
      addTestResult('Signup - Valid signup creates account and returns token', true);
      const signupToken = signupResponse.data.token;
      const signupUserId = signupResponse.data.user.id;
      
      // Test 2: Duplicate email
      try {
        await axios.post(`${API_URL}/auth/signup`, {
          name: 'Test CA User 2',
          email: signupEmail,
          password: 'testpass123',
        });
        addTestResult('Signup - Duplicate email rejected', false, 'Should have failed');
      } catch (error) {
        if (error.response?.status === 400) {
          addTestResult('Signup - Duplicate email rejected', true);
        } else {
          addTestResult('Signup - Duplicate email rejected', false, error.message);
        }
      }
      
      // Test 3: Missing required fields
      try {
        await axios.post(`${API_URL}/auth/signup`, {
          email: 'test@example.com',
          // Missing name and password
        });
        addTestResult('Signup - Missing required fields rejected', false, 'Should have failed');
      } catch (error) {
        if (error.response?.status === 400) {
          addTestResult('Signup - Missing required fields rejected', true);
        } else {
          addTestResult('Signup - Missing required fields rejected', false, error.message);
        }
      }
      
      // Test 4: Password too short
      try {
        await axios.post(`${API_URL}/auth/signup`, {
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: '12345', // Less than 6 characters
        });
        addTestResult('Signup - Short password rejected', false, 'Should have failed');
      } catch (error) {
        if (error.response?.status === 400) {
          addTestResult('Signup - Short password rejected', true);
        } else {
          addTestResult('Signup - Short password rejected', false, error.message);
        }
      }
      
      return { token: signupToken, userId: signupUserId, email: signupEmail };
    } else {
      addTestResult('Signup - Valid signup', false, 'Invalid response structure');
      return null;
    }
  } catch (error) {
    addTestResult('Signup - Valid signup', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testLogin() {
  log('\n🔐 Testing Login Feature...', 'blue');
  
  try {
    // Test login with test user
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'ramesh@cafirm.com',
      password: 'password123',
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token && loginResponse.data.user) {
      addTestResult('Login - Valid credentials', true);
      return loginResponse.data.token;
    } else {
      addTestResult('Login - Valid credentials', false, 'Invalid response structure');
      return null;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('⚠️  Test user not found. Run: node scripts/create-first-user.js "Ramesh Kumar" "ramesh@cafirm.com" "password123"', 'yellow');
      addTestResult('Login - Valid credentials', false, 'Test user does not exist');
    } else {
      addTestResult('Login - Valid credentials', false, error.response?.data?.error || error.message);
    }
    return null;
  }
}

async function testGetMe(token) {
  log('\n👤 Testing Get Current User...', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.status === 200 && response.data.email) {
      addTestResult('Get Me - Returns user data', true);
      return response.data;
    } else {
      addTestResult('Get Me - Returns user data', false, 'Invalid response structure');
      return null;
    }
  } catch (error) {
    addTestResult('Get Me - Returns user data', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testClients(token) {
  log('\n👥 Testing Clients API...', 'blue');
  
  try {
    // Get clients
    const getResponse = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      addTestResult('Clients - Get clients list', true);
      
      // Create client
      const createResponse = await axios.post(
        `${API_URL}/clients`,
        {
          name: `Test Client ${Date.now()}`,
          contactPerson: 'Test Contact',
          email: `testclient${Date.now()}@example.com`,
          phone: '+91-9876543210',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (createResponse.status === 201 && createResponse.data.id) {
        addTestResult('Clients - Create client', true);
        const clientId = createResponse.data.id;
        
        // Get single client
        const getSingleResponse = await axios.get(`${API_URL}/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (getSingleResponse.status === 200) {
          addTestResult('Clients - Get single client', true);
        } else {
          addTestResult('Clients - Get single client', false, 'Failed');
        }
        
        return clientId;
      } else {
        addTestResult('Clients - Create client', false, 'Invalid response');
        return null;
      }
    } else {
      addTestResult('Clients - Get clients list', false, 'Invalid response structure');
      return null;
    }
  } catch (error) {
    addTestResult('Clients - API test', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testDashboard(token) {
  log('\n📊 Testing Dashboard API...', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.status === 200 && response.data.metrics) {
      addTestResult('Dashboard - Get dashboard metrics', true);
      return true;
    } else {
      addTestResult('Dashboard - Get dashboard metrics', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    addTestResult('Dashboard - Get dashboard metrics', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testTasks(token) {
  log('\n📋 Testing Tasks API...', 'blue');
  
  try {
    // Get tasks
    const getResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      addTestResult('Tasks - Get tasks list', true);
      return true;
    } else {
      addTestResult('Tasks - Get tasks list', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    addTestResult('Tasks - Get tasks list', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testInvoices(token) {
  log('\n💰 Testing Invoices API...', 'blue');
  
  try {
    const getResponse = await axios.get(`${API_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      addTestResult('Invoices - Get invoices list', true);
      return true;
    } else {
      addTestResult('Invoices - Get invoices list', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    addTestResult('Invoices - Get invoices list', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testFirms(token) {
  log('\n🏢 Testing Firms API...', 'blue');
  
  try {
    const getResponse = await axios.get(`${API_URL}/firms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      addTestResult('Firms - Get firms list', true);
      return true;
    } else {
      addTestResult('Firms - Get firms list', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    addTestResult('Firms - Get firms list', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testDocuments(token) {
  log('\n📄 Testing Documents API...', 'blue');
  
  try {
    const getResponse = await axios.get(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      addTestResult('Documents - Get documents list', true);
      return true;
    } else {
      addTestResult('Documents - Get documents list', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    addTestResult('Documents - Get documents list', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testApprovals(token) {
  log('\n✅ Testing Approvals API...', 'blue');
  
  try {
    const getResponse = await axios.get(`${API_URL}/approvals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      addTestResult('Approvals - Get approvals list', true);
      return true;
    } else {
      addTestResult('Approvals - Get approvals list', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    addTestResult('Approvals - Get approvals list', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function runAllTests() {
  log('🧪 Starting Comprehensive API Tests...\n', 'blue');
  log('=' .repeat(60), 'blue');
  
  // Test signup first
  const signupResult = await testSignup();
  
  // Test login
  let token = null;
  const loginToken = await testLogin();
  if (loginToken) {
    token = loginToken;
  } else if (signupResult?.token) {
    token = signupResult.token;
    log('⚠️  Using signup token for remaining tests', 'yellow');
  }
  
  if (!token) {
    log('\n❌ Cannot proceed with authenticated tests - no valid token', 'red');
    printSummary();
    process.exit(1);
  }
  
  // Test authenticated endpoints
  await testGetMe(token);
  await testDashboard(token);
  await testClients(token);
  await testFirms(token);
  await testTasks(token);
  await testInvoices(token);
  await testDocuments(token);
  await testApprovals(token);
  
  printSummary();
}

function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 Test Summary:', 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`📝 Total: ${testResults.passed + testResults.failed}`, 'blue');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`  - ${t.name}: ${t.error}`, 'red');
      });
  }
  
  log('\n' + '='.repeat(60) + '\n', 'blue');
}

// Check if server is accessible
axios.get(API_URL.replace('/api', '/health'))
  .then(() => {
    runAllTests();
  })
  .catch((error) => {
    log('❌ Backend server is not running!', 'red');
    log('Please start the backend server first:', 'yellow');
    log('  cd backend && npm run dev', 'yellow');
    process.exit(1);
  });

