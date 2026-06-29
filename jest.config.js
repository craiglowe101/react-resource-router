// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: './coverage/',
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 88,
      lines: 92,
    },
  },
  resetMocks: true,
  setupFilesAfterEnv: ['<rootDir>jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/?(*.)*test.ts?(x)',
    '<rootDir>/codemods/**/?(*.)*test.ts?(x)',
  ],
  verbose: true,
};
