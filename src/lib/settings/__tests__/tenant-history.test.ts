import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils/request-now', () => ({
  getRequestNow: vi.fn().mockResolvedValue(new Date(2027, 0, 5)),
}));
vi.mock('@/lib/queries/settings/get-app-settings', () => ({
  getAppSettingsCached: vi
    .fn()
    .mockResolvedValue({ tenantHistoryYearsBack: 2 }),
}));

const { getTenantHistoryStartYear } =
  await import('@/lib/settings/tenant-history');

describe('getTenantHistoryStartYear', () => {
  it('combines the request date with the stored setting', async () => {
    await expect(getTenantHistoryStartYear()).resolves.toBe(2025);
  });
});
