import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpsert = vi.fn((args: unknown) => args);
const mockTransaction = vi.fn().mockResolvedValue([]);
const mockFindMany = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    appSetting: { upsert: mockUpsert, findMany: mockFindMany },
  },
}));

const { updateAppSettings } =
  await import('@/lib/mutations/settings/update-app-settings');

describe('updateAppSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts a changed setting by key and returns all settings', async () => {
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ key: 'tenantHistoryYearsBack', value: 3 }]);

    await expect(
      updateAppSettings({ tenantHistoryYearsBack: 3 })
    ).resolves.toEqual({ tenantHistoryYearsBack: 3 });

    expect(mockTransaction).toHaveBeenCalledWith([
      {
        where: { key: 'tenantHistoryYearsBack' },
        create: { key: 'tenantHistoryYearsBack', value: 3 },
        update: { value: 3 },
      },
    ]);
  });

  it('does not write settings whose value is unchanged', async () => {
    mockFindMany.mockResolvedValue([
      { key: 'tenantHistoryYearsBack', value: 2 },
    ]);

    await expect(
      updateAppSettings({ tenantHistoryYearsBack: 2 })
    ).resolves.toEqual({ tenantHistoryYearsBack: 2 });

    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
