module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'miniflare',
  testEnvironmentOptions: {
    // Miniflare options
    bindings: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'debug',
      CACHE_TTL_SECONDS: '60',
      MAX_CACHE_SIZE: '100',
      API_TIMEOUT_SECONDS: '10',
      MAX_RESULTS_DEFAULT: '3',
      MAX_RESULTS_LIMIT: '10',
      RATE_LIMIT_REQUESTS_PER_MINUTE: '10',
    },
    kvNamespaces: ['CACHE'],
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
};
