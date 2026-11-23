import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: vi.fn().mockResolvedValue(new Date(2027, 0, 5)),
}));
vi.mock('@/lib/framework/rsc-cache', () => ({
  getTenantHistoryYearsBack: vi.fn().mockResolvedValue(2),
}));

const { getTenantHistoryStartYear } =
  await import('@/lib/framework/tenant-history');

describe('getTenantHistoryStartYear', () => {
  it('combines the request date with the stored setting', async () => {
    await expect(getTenantHistoryStartYear()).resolves.toBe(2025);
  });
});
