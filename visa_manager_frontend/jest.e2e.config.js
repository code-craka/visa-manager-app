module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/e2e/**/*.test.{js,ts}'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/e2e/setup.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
};