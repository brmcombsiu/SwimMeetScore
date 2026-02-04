module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/app-logic.test.js'  // Static analysis test, runs separately
  ],
  verbose: true
};
