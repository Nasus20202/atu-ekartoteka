import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindMany = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: { appSetting: { findMany: mockFindMany } },
}));

const { getAppSettingsCached, invalidateAppSettingsCache } =
  await import('@/lib/queries/settings/get-app-settings');

const FIVE_MINUTES_MS = 5 * 60 * 1000;

describe('getAppSettingsCached', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    invalidateAppSettingsCache();
    mockFindMany.mockResolvedValue([
      { key: 'tenantHistoryYearsBack', value: 4 },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the resolved settings', async () => {
    await expect(getAppSettingsCached()).resolves.toEqual({
      tenantHistoryYearsBack: 4,
    });
  });

  it('queries the database once within the cache lifetime', async () => {
    await getAppSettingsCached();
    await getAppSettingsCached();
    vi.advanceTimersByTime(FIVE_MINUTES_MS - 1);
    await getAppSettingsCached();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it('reads the database again after the lifetime', async () => {
    await getAppSettingsCached();
    vi.advanceTimersByTime(FIVE_MINUTES_MS + 1);
    mockFindMany.mockResolvedValue([
      { key: 'tenantHistoryYearsBack', value: 7 },
    ]);

    await expect(getAppSettingsCached()).resolves.toEqual({
      tenantHistoryYearsBack: 7,
    });
    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });

  it('reads the database again after the cache is invalidated', async () => {
    await getAppSettingsCached();
    invalidateAppSettingsCache();
    await getAppSettingsCached();

    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });
});
