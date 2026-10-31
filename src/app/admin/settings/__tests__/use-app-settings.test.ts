import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSettings } from '@/app/admin/settings/use-app-settings';

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('useAppSettings', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads the history window', async () => {
    fetchMock.mockResolvedValue(json(true, { tenantHistoryYearsBack: 3 }));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => expect(result.current.yearsBack).toBe(3));
    expect(result.current.loadError).toBeNull();
  });

  it('reports a load error for a failed response', async () => {
    fetchMock.mockResolvedValue(json(false, {}));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() =>
      expect(result.current.loadError).toBe('Nie udało się pobrać ustawień')
    );
    expect(result.current.yearsBack).toBeNull();
  });

  it('reports a load error when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() =>
      expect(result.current.loadError).toBe('Nie udało się pobrać ustawień')
    );
  });

  it('does not update state after unmount', async () => {
    let resolve: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));

    const { result, unmount } = renderHook(() => useAppSettings());
    unmount();
    await act(async () => resolve(json(false, {})));

    expect(result.current.loadError).toBeNull();
  });

  it('does not report an error that arrives after unmount', async () => {
    let reject: (reason: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((_, r) => (reject = r)));

    const { result, unmount } = renderHook(() => useAppSettings());
    unmount();
    await act(async () => reject(new Error('offline')));

    expect(result.current.loadError).toBeNull();
  });

  it('saves the new history window', async () => {
    fetchMock.mockResolvedValueOnce(json(true, { tenantHistoryYearsBack: 1 }));
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.yearsBack).toBe(1));

    fetchMock.mockResolvedValueOnce(json(true, { tenantHistoryYearsBack: 5 }));
    await act(() => result.current.save(5));

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/admin/settings',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ tenantHistoryYearsBack: 5 }),
      })
    );
    expect(result.current.yearsBack).toBe(5);
    expect(result.current.status).toEqual({ kind: 'saved' });
    expect(result.current.saving).toBe(false);
  });

  it('shows the API error message when saving fails', async () => {
    fetchMock.mockResolvedValueOnce(json(true, { tenantHistoryYearsBack: 1 }));
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.yearsBack).toBe(1));

    fetchMock.mockResolvedValueOnce(json(false, { error: 'Zła wartość' }));
    await act(() => result.current.save(99));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Zła wartość',
    });
    expect(result.current.yearsBack).toBe(1);
  });

  it('falls back to a generic message when the API gives none', async () => {
    fetchMock.mockResolvedValueOnce(json(true, { tenantHistoryYearsBack: 1 }));
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.yearsBack).toBe(1));

    fetchMock.mockResolvedValueOnce(json(false, {}));
    await act(() => result.current.save(2));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
  });

  it('shows a generic message when the save request throws', async () => {
    fetchMock.mockResolvedValueOnce(json(true, { tenantHistoryYearsBack: 1 }));
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.yearsBack).toBe(1));

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save(2));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
    expect(result.current.saving).toBe(false);
  });
});
