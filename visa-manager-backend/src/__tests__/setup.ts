import { Pool } from 'pg';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.CLERK_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.CLERK_SECRET_KEY = 'test-secret-key';
process.env.CLERK_JWKS_URL = 'https://test.clerk.com/.well-known/jwks.json';

// Mock database pool
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
} as unknown as Pool;

jest.mock('../db', () => ({
  default: mockPool,
}));

// Mock JWKS client
jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getSigningKey: jest.fn(() => Promise.resolve({
      getPublicKey: () => 'mock-public-key',
    })),
  })),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, key, options, callback) => {
    const mockPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'agency',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    callback(null, mockPayload);
  }),
  sign: jest.fn(() => 'mock-jwt-token'),
}));

// Mock WebSocket
jest.mock('ws', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock Socket.IO (if needed)
// jest.mock('socket.io', () => ({ ... }));

// Global test setup
beforeAll(async () => {
  // Setup test database or mock connections
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database or connections
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Increase timeout for integration tests
jest.setTimeout(30000);