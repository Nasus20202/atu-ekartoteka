import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    appSettings: { upsert: mockUpsert, findUnique: mockFindUnique },
  },
}));

// A cached reader must never serve the comparison: it would be stale in the
// request that saved the value.
const mockCached = vi.fn();
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: () => mockCached,
}));

const { updateAppSettings } =
  await import('@/lib/mutations/settings/update-app-settings');

const YEARS_SELECT = { tenantHistoryYearsBack: true };

describe('updateAppSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts the single row and returns the stored values', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 2 });
    mockUpsert.mockResolvedValue({ tenantHistoryYearsBack: 3 });

    await expect(
      updateAppSettings({ tenantHistoryYearsBack: 3 })
    ).resolves.toEqual({ tenantHistoryYearsBack: 3 });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { id: 1, tenantHistoryYearsBack: 3 },
      update: { tenantHistoryYearsBack: 3 },
      select: YEARS_SELECT,
    });
  });

  it('reads and returns only the updated keys', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 2 });
    mockUpsert.mockResolvedValue({ tenantHistoryYearsBack: 3 });

    await updateAppSettings({ tenantHistoryYearsBack: 3 });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: YEARS_SELECT,
    });
  });

  it('creates the row on the first save', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({ tenantHistoryYearsBack: 7 });

    await updateAppSettings({ tenantHistoryYearsBack: 7 });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { id: 1, tenantHistoryYearsBack: 7 },
      })
    );
  });

  it('does not write when the value is unchanged', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 2 });

    await expect(
      updateAppSettings({ tenantHistoryYearsBack: 2 })
    ).resolves.toEqual({ tenantHistoryYearsBack: 2 });

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('does not write when saving the default to a missing row', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      updateAppSettings({ tenantHistoryYearsBack: 2 })
    ).resolves.toEqual({ tenantHistoryYearsBack: 2 });
    await expect(updateAppSettings({ privacyPolicy: null })).resolves.toEqual({
      privacyPolicy: null,
    });

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('stores a policy text and clears it with null', async () => {
    mockFindUnique.mockResolvedValue({ privacyPolicy: 'Stary tekst' });
    mockUpsert.mockResolvedValue({ privacyPolicy: null });

    await expect(updateAppSettings({ privacyPolicy: null })).resolves.toEqual({
      privacyPolicy: null,
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { privacyPolicy: null },
        select: { privacyPolicy: true },
      })
    );
  });

  it('compares against an uncached read', async () => {
    mockCached.mockResolvedValue({ tenantHistoryYearsBack: 9 });
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 2 });
    mockUpsert.mockResolvedValue({ tenantHistoryYearsBack: 9 });

    await updateAppSettings({ tenantHistoryYearsBack: 9 });

    expect(mockCached).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
