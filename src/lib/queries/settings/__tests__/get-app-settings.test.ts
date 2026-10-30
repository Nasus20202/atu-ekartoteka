import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindMany = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: { appSetting: { findMany: mockFindMany } },
}));

const { getAppSettings } =
  await import('@/lib/queries/settings/get-app-settings');

describe('getAppSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to defaults when no rows are stored', async () => {
    mockFindMany.mockResolvedValue([]);

    await expect(getAppSettings()).resolves.toEqual({
      tenantHistoryYearsBack: 2,
    });
  });

  it('returns stored values', async () => {
    mockFindMany.mockResolvedValue([
      { key: 'tenantHistoryYearsBack', value: 5 },
    ]);

    await expect(getAppSettings()).resolves.toEqual({
      tenantHistoryYearsBack: 5,
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      select: { key: true, value: true },
    });
  });
});
