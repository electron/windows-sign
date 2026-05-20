/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: [
    '**/src/**/*.test.ts'  // Only run .test.ts files, not .spec.ts files designed for node:test
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts'
  ],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^./sign-with-signtool$': '<rootDir>/__mocks__/sign-with-signtool-mock.js',
    '^./sign-with-signtool.js$': '<rootDir>/__mocks__/sign-with-signtool-mock.js'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.test.json',
        diagnostics: {
          ignoreCodes: [151002], // Ignore isolatedModules warning
        }
      },
    ],
  },
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/test/'  // Ignore test/ dir which contains node:test spec files
  ]
};