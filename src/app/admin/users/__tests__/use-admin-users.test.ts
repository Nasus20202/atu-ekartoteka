import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAdminUsers } from '@/app/admin/users/use-admin-users';

function usersBody(ids: string[], page = 1, totalPages = 1) {
  return {
    users: ids.map((id) => ({ id })),
    pagination: { page, limit: 50, total: ids.length, totalPages },
  };
}

function stubFetch(...bodies: object[]) {
  const fetchMock = vi.fn();
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const requestedUrls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([url]) => url);

const ids = (users: Array<{ id: string }>) => users.map((user) => user.id);

describe('useAdminUsers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads pending users and appends the next page', async () => {
    const fetchMock = stubFetch(
      usersBody(['u1'], 1, 2),
      usersBody(['u2'], 2, 2)
    );

    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ids(result.current.users)).toEqual(['u1']);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.users).toHaveLength(2));

    expect(ids(result.current.users)).toEqual(['u1', 'u2']);
    expect(requestedUrls(fetchMock)).toEqual([
      '/api/admin/users?status=PENDING&page=1',
      '/api/admin/users?status=PENDING&page=2',
    ]);
  });

  it('restarts from the first page when the filter changes', async () => {
    const fetchMock = stubFetch(usersBody(['u1'], 1, 2), usersBody(['admin']));
    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setFilter('ADMINS'));

    await waitFor(() => expect(ids(result.current.users)).toEqual(['admin']));
    expect(requestedUrls(fetchMock)[1]).toBe(
      '/api/admin/users?role=ADMIN&page=1'
    );
  });

  it('restarts with the debounced search term', async () => {
    const fetchMock = stubFetch(usersBody(['u1']), usersBody(['anna']));
    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setUserSearch('anna'));

    await waitFor(() => expect(ids(result.current.users)).toEqual(['anna']));
    expect(requestedUrls(fetchMock)[1]).toBe(
      '/api/admin/users?status=PENDING&page=1&search=anna'
    );
  });

  it('refreshes the loaded pages and drops users that no longer match', async () => {
    stubFetch(
      usersBody(['u1', 'u2'], 1, 2),
      usersBody(['u3'], 2, 2),
      usersBody(['u1', 'u3'], 1, 1),
      usersBody([], 2, 1)
    );
    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.users).toHaveLength(3));

    await act(() => result.current.refresh());

    expect(ids(result.current.users)).toEqual(['u1', 'u3']);
    expect(result.current.hasMore).toBe(false);
  });

  it('reports a failed response as a load error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.users).toEqual([]);
  });
});
