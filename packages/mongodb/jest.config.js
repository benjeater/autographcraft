import sharedConfig from '../../jest.config.js';

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  ...sharedConfig,
  rootDir: '.',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/../../node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],
  moduleNameMapper: {
    '@autographcraft/(.*)': '<rootDir>/../$1/src/app.ts',
  },
};
