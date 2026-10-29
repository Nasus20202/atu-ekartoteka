import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchUnassignedHoas,
  formatBulkResult,
  runBulkOperation,
} from '@/app/admin/users/management/bulk-requests';

function stubResponse(ok: boolean, body: object) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('bulk requests', () => {
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

  it('posts the selected apartments to the operation endpoint', async () => {
    const result = { created: 2, skipped: 0, errors: 0 };
    const fetchMock = stubResponse(true, result);

    await expect(runBulkOperation('create', ['a', 'b'])).resolves.toEqual({
      data: result,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/users/bulk-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apartmentIds: ['a', 'b'] }),
    });
  });

  it('falls back to the operation error message', async () => {
    stubResponse(false, {});
    await expect(runBulkOperation('assign', ['a'])).resolves.toEqual({
      error: 'Wystąpił błąd podczas przypisywania kont',
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
