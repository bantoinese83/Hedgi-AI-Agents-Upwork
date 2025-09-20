// Manual mock for @hedgi/ai module
const mockCallWithJSONMode = jest.fn();
const mockPrunePayload = jest.fn();
const mockIsAllowed = jest.fn();
const mockParse = jest.fn();
const mockLogRequest = jest.fn();
const mockError = jest.fn();

module.exports = {
  createHedgiOpenAI: jest.fn(() => ({
    callWithJSONMode: mockCallWithJSONMode,
    prunePayload: mockPrunePayload,
  })),
  defaultRateLimiter: {
    isAllowed: mockIsAllowed,
    getRemainingRequests: jest.fn(() => 9),
    getResetTime: jest.fn(() => Date.now() + 60000),
  },
  logger: {
    error: mockError,
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  performanceMonitor: {
    logRequest: mockLogRequest,
    getHealthStatus: jest.fn(),
  },
  SMBExplainerInputSchema: {
    parse: mockParse,
  },
  SMBExplainerResponseSchema: {
    parse: jest.fn(),
  },
  // Export the mock functions for use in tests
  __mockCallWithJSONMode: mockCallWithJSONMode,
  __mockPrunePayload: mockPrunePayload,
  __mockIsAllowed: mockIsAllowed,
  __mockParse: mockParse,
  __mockLogRequest: mockLogRequest,
  __mockError: mockError,
};
