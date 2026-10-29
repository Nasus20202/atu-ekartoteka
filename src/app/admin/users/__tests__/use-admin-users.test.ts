import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAdminUsers } from '@/app/admin/users/use-admin-users';

function stubFetch(...responses: Array<{ ok: boolean; body: object }>) {
  const fetchMock = vi.fn();
  for (const { ok, body } of responses) {
    fetchMock.mockResolvedValueOnce({ ok, json: () => Promise.resolve(body) });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useAdminUsers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('loads users and defaults to one page without pagination data', async () => {
    stubFetch({ ok: true, body: { users: [{ id: 'u1' }] } });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual([{ id: 'u1' }]);
    expect(result.current.totalPages).toBe(1);
  });

  it('keeps users on a failed response and logs network errors', async () => {
    stubFetch({ ok: false, body: { error: 'x' } });
    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual([]);

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await act(() => result.current.fetchUsers());
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('ignores a response superseded by a newer request', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            users: [{ id: 'new' }],
            pagination: { totalPages: 3 },
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAdminUsers());
    await act(() => result.current.fetchUsers());
    await act(async () => {
      resolveFirst({
        ok: true,
        json: () => Promise.resolve({ users: [{ id: 'old' }] }),
      });
    });

    expect(result.current.users).toEqual([{ id: 'new' }]);
    expect(result.current.totalPages).toBe(3);
  });
});
