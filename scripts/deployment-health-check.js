#!/usr/bin/env node

const https = require('https');
const http = require('http');

const healthChecks = [
  {
    name: 'Web Application',
    url: process.env.WEB_URL || 'http://localhost:3000',
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'API Health',
    url: process.env.API_URL || 'http://localhost:3000/api/health',
    expectedStatus: 200,
    timeout: 5000
  }
];

function checkHealth(check) {
  return new Promise((resolve) => {
    const client = check.url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(check.url, { timeout: check.timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      const success = res.statusCode === check.expectedStatus;
      
      resolve({
        name: check.name,
        url: check.url,
        status: res.statusCode,
        success,
        responseTime,
        message: success ? 'OK' : `Expected ${check.expectedStatus}, got ${res.statusCode}`
      });
    });

    req.on('error', (error) => {
      resolve({
        name: check.name,
        url: check.url,
        status: 0,
        success: false,
        responseTime: Date.now() - startTime,
        message: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: check.name,
        url: check.url,
        status: 0,
        success: false,
        responseTime: check.timeout,
        message: 'Request timeout'
      });
    });
  });
}

async function runHealthChecks() {
  console.log('🏥 Running deployment health checks...\n');
  
  const results = await Promise.all(healthChecks.map(checkHealth));
  
  let allPassed = true;
  
  results.forEach(result => {
    const emoji = result.success ? '✅' : '❌';
    console.log(`${emoji} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log(`   Message: ${result.message}\n`);
    
    if (!result.success) {
      allPassed = false;
    }
  });
  
  const summary = {
    timestamp: new Date().toISOString(),
    overall: allPassed ? 'HEALTHY' : 'UNHEALTHY',
    checks: results
  };
  
  require('fs').writeFileSync(
    require('path').join(__dirname, '../health-check-report.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`🎯 Overall Status: ${summary.overall}`);
  console.log('📄 Report saved to health-check-report.json');
  
  if (!allPassed) {
    process.exit(1);
  }
}

runHealthChecks().catch(console.error);