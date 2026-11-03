import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindMany = vi.fn();
const mockCacheLife = vi.fn();
const mockCacheTag = vi.fn();

vi.mock('next/cache', () => ({
  cacheLife: mockCacheLife,
  cacheTag: mockCacheTag,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { appSetting: { findMany: mockFindMany } },
}));

const { getAppSettingsCached } =
  await import('@/lib/queries/settings/get-app-settings');

describe('getAppSettingsCached', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([
      { key: 'tenantHistoryYearsBack', value: 4 },
    ]);
  });

  it('returns the resolved settings', async () => {
    await expect(getAppSettingsCached()).resolves.toEqual({
      tenantHistoryYearsBack: 4,
    });
  });

  it('registers the shared lifetime and invalidation tag', async () => {
    await getAppSettingsCached();

    expect(mockCacheLife).toHaveBeenCalledWith({
      stale: 60,
      revalidate: 300,
      expire: 300,
    });
    expect(mockCacheTag).toHaveBeenCalledWith('app-settings');
  });
});
