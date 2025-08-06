// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_test';
process.env.CLERK_SECRET_KEY = 'sk_test_test';