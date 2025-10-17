export default {
  testEnvironment: 'node',
  preset: null,
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!src/index.js',
    '!src/config/env.js',
    '!src/config/test-env.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}