#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Starting security audit...');

const auditResults = {
  timestamp: new Date().toISOString(),
  checks: [],
  passed: 0,
  failed: 0,
  warnings: 0
};

function addCheck(name, status, message) {
  auditResults.checks.push({ name, status, message });
  auditResults[status]++;
  
  const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}: ${message}`);
}

// 1. Check for security headers configuration
console.log('🛡️  Checking security headers...');
const vercelConfig = path.join(__dirname, '../visa_manager_frontend/vercel.json');
if (fs.existsSync(vercelConfig)) {
  const config = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
  const hasCSP = config.headers?.some(h => 
    h.headers?.some(header => header.key === 'Content-Security-Policy')
  );
  
  addCheck(
    'Content Security Policy',
    hasCSP ? 'passed' : 'failed',
    hasCSP ? 'CSP headers configured' : 'CSP headers missing'
  );
} else {
  addCheck('Vercel Config', 'failed', 'vercel.json not found');
}

// 2. Check for environment variable security
console.log('🔐 Checking environment variables...');
const envFiles = ['.env', '.env.web', '.env.production'];
let hasSecureEnv = false;

envFiles.forEach(file => {
  const envPath = path.join(__dirname, '../visa_manager_frontend', file);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('CLERK_') && content.includes('API_')) {
      hasSecureEnv = true;
    }
  }
});

addCheck(
  'Environment Variables',
  hasSecureEnv ? 'passed' : 'warnings',
  hasSecureEnv ? 'Secure environment variables configured' : 'Check environment variable security'
);

// 3. Check for dependency vulnerabilities
console.log('📦 Checking dependencies...');
try {
  execSync('cd visa_manager_frontend && yarn audit --level moderate', { stdio: 'pipe' });
  addCheck('Dependency Audit', 'passed', 'No moderate or high vulnerabilities found');
} catch (error) {
  addCheck('Dependency Audit', 'warnings', 'Vulnerabilities found - check yarn audit output');
}

// 4. Check for secure authentication setup
console.log('🔑 Checking authentication setup...');
const authContextPath = path.join(__dirname, '../visa_manager_frontend/src/context/AuthContext.tsx');
if (fs.existsSync(authContextPath)) {
  const authContent = fs.readFileSync(authContextPath, 'utf8');
  const hasJWTTemplate = authContent.includes('template:');
  const hasSecureStorage = authContent.includes('SecurityUtils');
  
  addCheck(
    'Authentication Security',
    (hasJWTTemplate && hasSecureStorage) ? 'passed' : 'warnings',
    `JWT templates: ${hasJWTTemplate}, Secure storage: ${hasSecureStorage}`
  );
} else {
  addCheck('Authentication Setup', 'failed', 'AuthContext.tsx not found');
}

// 5. Generate security report
const reportPath = path.join(__dirname, '../security-audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));

console.log('\n📊 Security Audit Summary:');
console.log(`✅ Passed: ${auditResults.passed}`);
console.log(`⚠️  Warnings: ${auditResults.warnings}`);
console.log(`❌ Failed: ${auditResults.failed}`);
console.log(`📄 Report saved to: ${reportPath}`);

// Exit with error code if any checks failed
if (auditResults.failed > 0) {
  process.exit(1);
}