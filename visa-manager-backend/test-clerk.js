// Simple test script to verify Clerk integration
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

// Test 1: Try to access protected endpoint without token
async function testWithoutAuth() {
  console.log('🔒 Testing protected endpoint without authentication...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthenticated request\n');
    } else {
      console.log('❌ Should have rejected unauthenticated request\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 2: Try with mock token (should fail with proper error)
async function testWithMockToken() {
  console.log('🔑 Testing with mock token...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': 'Bearer mock-invalid-token',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid token\n');
    } else {
      console.log('❌ Should have rejected invalid token\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Testing Clerk + Neon Integration\n');
  
  await testWithoutAuth();
  await testWithMockToken();
  
  console.log('📝 Next steps:');
  console.log('1. Get a real Clerk JWT token from the frontend');
  console.log('2. Test with real token to verify RLS policies');
  console.log('3. Test user sync and profile endpoints');
}

runTests().catch(console.error);