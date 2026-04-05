const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Only pick up .test.ts/tsx files — exclude bun:test files (role.test.ts uses bun:test)
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/app/api/auth/create-user/role.test.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
