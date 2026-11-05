import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindUnique = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: { appSettings: { findUnique: mockFindUnique } },
}));

// Emulates a request scope: results are memoised until `resetRequest()`.
let memo = new Map<unknown, unknown>();
vi.mock('react', () => ({
  cache: (fn: () => unknown) => () => {
    if (!memo.has(fn)) memo.set(fn, fn());
    return memo.get(fn);
  },
}));

const { getAppSettings, readAppSettings } =
  await import('@/lib/queries/settings/get-app-settings');

function resetRequest() {
  memo = new Map();
}

describe('settings queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRequest();
  });

  it('falls back to defaults when the row does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(readAppSettings()).resolves.toEqual({
      tenantHistoryYearsBack: 2,
    });
  });

  it('returns the stored values of the single row', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 5 });

    await expect(readAppSettings()).resolves.toEqual({
      tenantHistoryYearsBack: 5,
    });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      omit: { id: true, updatedAt: true },
    });
  });

  it('reads once per request however many callers ask', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 4 });

    const results = await Promise.all([
      getAppSettings(),
      getAppSettings(),
      getAppSettings(),
    ]);

    expect(results).toEqual(Array(3).fill({ tenantHistoryYearsBack: 4 }));
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  it('reads again in the next request', async () => {
    mockFindUnique.mockResolvedValueOnce({ tenantHistoryYearsBack: 4 });
    await getAppSettings();
    resetRequest();
    mockFindUnique.mockResolvedValueOnce({ tenantHistoryYearsBack: 6 });

    await expect(getAppSettings()).resolves.toEqual({
      tenantHistoryYearsBack: 6,
    });
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });
});
