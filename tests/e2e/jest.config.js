module.exports = {
  maxWorkers: 1,
  testTimeout: 120000,
  testEnvironment: './environment',
  testRunner: 'jest-circus/runner',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  testMatch: ['**/e2e/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['./init.js'],
};