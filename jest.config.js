/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  // The packages are ESM ("type": "module"), and so is the test harness:
  // @graphql-codegen/cli 7 depends on yargs 18, which ships ESM only and
  // cannot be require()d by a CJS transform. Running Jest in ESM mode needs
  // NODE_OPTIONS=--experimental-vm-modules, which each package's test script
  // sets.
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
        useESM: true,
      },
    ],
  },
  // TypeScript ESM output imports siblings with a `.js` extension that does
  // not exist before compilation, so map it back to the source file.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  passWithNoTests: true,
  rootDir: '.',
  verbose: true,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],
  testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.[jt]sx?$',
};
