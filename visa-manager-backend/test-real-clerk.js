// Test script to verify real Clerk integration
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testRealClerkIntegration() {
  console.log('🚀 Testing Real Clerk + Neon Integration\n');
  
  console.log('✅ Backend Configuration:');
  console.log('- CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing');
  console.log('- CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'Set' : 'Missing');
  console.log('- DATABASE_AUTHENTICATED_URL:', process.env.DATABASE_AUTHENTICATED_URL ? 'Set' : 'Missing');
  console.log('');
  
  // Test health endpoint
  try {
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health Check:', healthData.status);
  } catch (error) {
    console.log('❌ Backend Health Check Failed:', error.message);
    return;
  }
  
  // Test protected endpoint without auth
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Protected endpoint correctly rejects unauthenticated requests');
    } else {
      console.log('❌ Protected endpoint should reject unauthenticated requests');
    }
  } catch (error) {
    console.log('❌ Error testing protected endpoint:', error.message);
  }
  
  console.log('\n📱 Next Steps:');
  console.log('1. Run the Android app: yarn android');
  console.log('2. Sign in with Google through Clerk');
  console.log('3. The app should now work with real authentication');
  console.log('4. Check backend logs for successful token verification');
}

testRealClerkIntegration().catch(console.error);