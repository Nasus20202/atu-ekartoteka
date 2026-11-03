import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePendingCount } from '@/components/users/use-pending-count';

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('usePendingCount', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the pending total from the users API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json(true, { pagination: { total: 7 } }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePendingCount());

    await waitFor(() => expect(result.current.pendingCount).toBe(7));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/users?status=PENDING&limit=1'
    );
  });

  it('keeps the count when the API answers with an error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePendingCount());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(result.current.pendingCount).toBe(0);
  });

  it('treats a response without pagination as zero pending accounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(true, {})));

    const { result } = renderHook(() => usePendingCount());

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current.pendingCount).toBe(0);
  });

  it('logs network errors', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    renderHook(() => usePendingCount());

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it('reloads the count on demand', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(true, { pagination: { total: 2 } }))
      .mockResolvedValueOnce(json(true, { pagination: { total: 1 } }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePendingCount());
    await waitFor(() => expect(result.current.pendingCount).toBe(2));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.pendingCount).toBe(1));
  });

  it('keeps zero when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePendingCount());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.pendingCount).toBe(0);
  });
});

describe('usePendingCount with a server-provided count', () => {
  it('starts from the count without requesting it', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePendingCount(4));

    expect(result.current.pendingCount).toBe(4);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('usePendingCount under strict mode', () => {
  it('does not request the count the server already loaded', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => usePendingCount(4), { wrapper: StrictMode });

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
