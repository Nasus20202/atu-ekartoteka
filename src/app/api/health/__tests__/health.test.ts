import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock functions
const mockQueryRaw = vi.fn();

// Mock the prisma client
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });
  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      // Mock successful database query
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks.database).toBe(true);
      expect(data.checks.application).toBe(true);
      expect(data.timestamp).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Mock failed database query
      mockQueryRaw.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.database).toBe(false);
      expect(data.checks.application).toBe(true);
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/health/liveness', () => {
    it('should always return alive status', async () => {
      const { GET } = await import('../liveness/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('alive');
      expect(data.timestamp).toBeDefined();
    });

    it('should not check external dependencies', async () => {
      const { GET } = await import('../liveness/route');
      await GET();

      // Verify prisma was not called
      expect(mockQueryRaw).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/health/readiness', () => {
    it('should return ready status when database is connected', async () => {
      // Mock successful database query
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const { GET } = await import('../readiness/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ready');
      expect(data.checks.database).toBe(true);
      expect(data.timestamp).toBeDefined();
    });

    it('should return not ready status when database is disconnected', async () => {
      // Mock failed database query
      mockQueryRaw.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const { GET } = await import('../readiness/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('not_ready');
      expect(data.checks.database).toBe(false);
      expect(data.timestamp).toBeDefined();
    });

    it('should check database connectivity', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const { GET } = await import('../readiness/route');
      await GET();

      // Verify prisma was called
      expect(mockQueryRaw).toHaveBeenCalled();
    });
  });

  describe('Response format', () => {
    it('should include timestamp in ISO format', async () => {
      const { GET } = await import('../liveness/route');
      const response = await GET();
      const data = await response.json();

      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should return JSON content type', async () => {
      const { GET } = await import('../liveness/route');
      const response = await GET();

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });
});
