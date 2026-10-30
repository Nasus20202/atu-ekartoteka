import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePendingCount } from '@/app/admin/users/use-pending-count';

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
