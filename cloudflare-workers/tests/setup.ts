/**
 * Jest setup file for Cloudflare Workers tests
 */

// Mock environment variables for tests
process.env.MOUNTVACATION_USERNAME = 'test_username';
process.env.MOUNTVACATION_PASSWORD = 'test_password';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug';

// Global test utilities
global.createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};

global.createMockEnv = (overrides = {}) => {
  return {
    MOUNTVACATION_USERNAME: 'test_username',
    MOUNTVACATION_PASSWORD: 'test_password',
    NODE_ENV: 'test',
    LOG_LEVEL: 'debug',
    CACHE_TTL_SECONDS: '60',
    MAX_CACHE_SIZE: '100',
    API_TIMEOUT_SECONDS: '10',
    MAX_RESULTS_DEFAULT: '3',
    MAX_RESULTS_LIMIT: '10',
    RATE_LIMIT_REQUESTS_PER_MINUTE: '10',
    ...overrides,
  };
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Console spy setup
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
