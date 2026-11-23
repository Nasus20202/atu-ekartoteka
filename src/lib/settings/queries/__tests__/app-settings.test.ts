import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindUnique = vi.fn();

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: { appSettings: { findUnique: mockFindUnique } },
}));

const {
  readAllSettings,
  readPrivacyPolicy,
  readSetting,
  readTenantHistoryYearsBack,
} = await import('@/lib/settings/queries/app-settings');

describe('settings queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await expect(readPrivacyPolicy()).resolves.toBeNull();
  });

  it('never loads the policy with the history window', async () => {
    mockFindUnique.mockResolvedValue({ tenantHistoryYearsBack: 4 });

    await readTenantHistoryYearsBack();

    expect(mockFindUnique.mock.calls[0][0].select).not.toHaveProperty(
      'privacyPolicy'
    );
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
