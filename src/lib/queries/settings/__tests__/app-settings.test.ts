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

const {
  getPrivacyPolicy,
  getTenantHistoryYearsBack,
  readAllSettings,
  readSetting,
} = await import('@/lib/queries/settings/app-settings');

function resetRequest() {
  memo = new Map();
}

describe('settings queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRequest();
  });

  it('falls back to the default when the row does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(readSetting('tenantHistoryYearsBack')).resolves.toBe(2);
    await expect(readSetting('privacyPolicy')).resolves.toBeNull();
  });

  it('selects only the requested column of the single row', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 5 });

    await expect(readSetting('tenantHistoryYearsBack')).resolves.toBe(5);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { tenantHistoryYearsBack: true },
    });
  });

  it('returns a stored null policy as null', async () => {
    mockFindUnique.mockResolvedValue({ privacyPolicy: null });

    await expect(getPrivacyPolicy()).resolves.toBeNull();
  });

  it('never loads the policy with the history window', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 4 });

    await getTenantHistoryYearsBack();

    expect(mockFindUnique.mock.calls[0][0].select).not.toHaveProperty(
      'privacyPolicy'
    );
  });

  it('reads once per request however many callers ask', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 4 });

    const results = await Promise.all([
      getTenantHistoryYearsBack(),
      getTenantHistoryYearsBack(),
      getTenantHistoryYearsBack(),
    ]);

    expect(results).toEqual([4, 4, 4]);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  it('issues one query per setting in one request', async () => {
    mockFindUnique.mockImplementation(
      async ({ select }: { select: Record<string, true> }) =>
        'privacyPolicy' in select
          ? { privacyPolicy: 'Tekst' }
          : { tenantHistoryYearsBack: 4 }
    );

    await Promise.all([
      getTenantHistoryYearsBack(),
      getPrivacyPolicy(),
      getTenantHistoryYearsBack(),
      getPrivacyPolicy(),
    ]);

    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });

  it('reads again in the next request', async () => {
    mockFindUnique.mockResolvedValueOnce({ tenantHistoryYearsBack: 4 });
    await getTenantHistoryYearsBack();
    resetRequest();
    mockFindUnique.mockResolvedValueOnce({ tenantHistoryYearsBack: 6 });

    await expect(getTenantHistoryYearsBack()).resolves.toBe(6);
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });

  it('reads every setting in one query for the settings form', async () => {
    mockFindUnique.mockResolvedValue({
      tenantHistoryYearsBack: 3,
      privacyPolicy: 'Tekst',
    });

    await expect(readAllSettings()).resolves.toEqual({
      tenantHistoryYearsBack: 3,
      privacyPolicy: 'Tekst',
    });
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindUnique.mock.calls[0][0].select).toEqual({
      tenantHistoryYearsBack: true,
      privacyPolicy: true,
    });
  });

  it('gives every default when nothing was saved yet', async () => {
    mockFindUnique.mockResolvedValue(null);

    const all = await readAllSettings();

    expect(all.privacyPolicy).toBeNull();
    expect(all.tenantHistoryYearsBack).toBe(
      await readSetting('tenantHistoryYearsBack')
    );
  });
});
