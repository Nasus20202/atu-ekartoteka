import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSettings } from '@/components/settings/use-app-settings';

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('useAppSettings', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts from the server-provided history window without fetching', () => {
    const { result } = renderHook(() => useAppSettings(3));

    expect(result.current.yearsBack).toBe(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves the new history window', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    fetchMock.mockResolvedValueOnce(json(true, { tenantHistoryYearsBack: 5 }));
    await act(() => result.current.save(5));

    expect(fetchMock).toHaveBeenCalledWith(
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
    const { result } = renderHook(() => useAppSettings(1));

    fetchMock.mockResolvedValueOnce(json(false, { error: 'Zła wartość' }));
    await act(() => result.current.save(99));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Zła wartość',
    });
    expect(result.current.yearsBack).toBe(1);
  });

  it('falls back to a generic message when the API gives none', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    fetchMock.mockResolvedValueOnce(json(false, {}));
    await act(() => result.current.save(2));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
  });

  it('shows a generic message when the save request throws', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save(2));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
    expect(result.current.saving).toBe(false);
  });
});
