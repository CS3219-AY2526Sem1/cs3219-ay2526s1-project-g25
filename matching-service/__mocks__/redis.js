// Mock for the 'redis' package
// This prevents the real Redis client from being created during tests

const mockClient = {
  connect: async () => undefined,
  disconnect: async () => undefined,
  quit: async () => undefined,
  hSet: async () => 1,
  hGet: async () => null,
  hGetAll: async () => ({}),
  hDel: async () => 1,
  del: async () => 1,
  zAdd: async () => 1,
  zRem: async () => 1,
  zRange: async () => [],
  zRangeWithScores: async () => [],
  zRangeByScoreWithScores: async () => [],
  expire: async () => 1,
  exists: async () => 0,
  on: () => mockClient,
  once: () => mockClient,
  off: () => mockClient,
};

export const createClient = () => mockClient;
export default { createClient };

