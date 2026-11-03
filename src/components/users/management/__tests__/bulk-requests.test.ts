import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchUnassignedHoas,
  formatBulkResult,
  runBulkOperation,
} from '@/components/users/management/bulk-requests';

const actionMock = vi.hoisted(() => ({
  bulkCreateAccountsAction: vi.fn(),
  bulkAssignAccountsAction: vi.fn(),
}));

vi.mock('@/actions/bulk-users', () => actionMock);

function stubResponse(ok: boolean, body: object) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('bulk requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches HOAs for the mode', async () => {
    const fetchMock = stubResponse(true, {
      hoas: [{ hoaId: 'h1' }],
      pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
    });

    await expect(fetchUnassignedHoas('assign')).resolves.toEqual({
      data: { hoas: [{ hoaId: 'h1' }], page: 1, totalPages: 3 },
    });
    await fetchUnassignedHoas('create', 2);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/admin/unassigned-apartments?mode=assignable&page=1',
      '/api/admin/unassigned-apartments?mode=creatable&page=2',
    ]);
  });

  it('returns the API error or a fallback when loading fails', async () => {
    stubResponse(false, { error: 'Brak uprawnień' });
    await expect(fetchUnassignedHoas('create')).resolves.toEqual({
      error: 'Brak uprawnień',
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchUnassignedHoas('create')).resolves.toEqual({
      error: 'Nie udało się pobrać listy mieszkań',
    });
  });

  it('runs the create action with the selected apartments', async () => {
    const result = { created: 2, skipped: 0, errors: 0 };
    actionMock.bulkCreateAccountsAction.mockResolvedValue({
      ok: true,
      data: result,
    });

    await expect(runBulkOperation('create', ['a', 'b'])).resolves.toEqual({
      data: result,
    });
    expect(actionMock.bulkCreateAccountsAction).toHaveBeenCalledWith({
      apartmentIds: ['a', 'b'],
    });
  });

  it('runs the assign action with the selected apartments', async () => {
    const result = { assigned: 1, skipped: 0, errors: 0 };
    actionMock.bulkAssignAccountsAction.mockResolvedValue({
      ok: true,
      data: result,
    });

    await expect(runBulkOperation('assign', ['a'])).resolves.toEqual({
      data: result,
    });
    expect(actionMock.bulkAssignAccountsAction).toHaveBeenCalledWith({
      apartmentIds: ['a'],
    });
  });

  it('returns the action error, or the operation message without one', async () => {
    actionMock.bulkAssignAccountsAction.mockResolvedValueOnce({
      ok: false,
      error: 'Wybierz co najmniej jedno mieszkanie',
      code: 'invalid',
    });
    await expect(runBulkOperation('assign', [])).resolves.toEqual({
      error: 'Wybierz co najmniej jedno mieszkanie',
    });

    actionMock.bulkAssignAccountsAction.mockResolvedValueOnce({
      ok: false,
      error: '',
      code: 'failed',
    });
    await expect(runBulkOperation('assign', ['a'])).resolves.toEqual({
      error: 'Wystąpił błąd podczas przypisywania kont',
    });

    actionMock.bulkCreateAccountsAction.mockRejectedValueOnce(
      new Error('offline')
    );
    await expect(runBulkOperation('create', ['a'])).resolves.toEqual({
      error: 'Wystąpił błąd podczas tworzenia kont',
    });
  });
});

describe('formatBulkResult', () => {
  it('summarises created accounts with errors', () => {
    expect(
      formatBulkResult('create', { created: 3, skipped: 1, errors: 2 })
    ).toBe('Utworzono 3 kont. Pominięto 1. Błędy: 2.');
  });

  it('summarises assignments and defaults missing counts to zero', () => {
    expect(formatBulkResult('assign', { skipped: 0, errors: 0 })).toBe(
      'Przypisano 0 mieszkań. Pominięto 0.'
    );
    expect(formatBulkResult('create', { skipped: 0, errors: 0 })).toBe(
      'Utworzono 0 kont. Pominięto 0.'
    );
    expect(
      formatBulkResult('assign', { assigned: 4, skipped: 0, errors: 0 })
    ).toBe('Przypisano 4 mieszkań. Pominięto 0.');
  });
});
