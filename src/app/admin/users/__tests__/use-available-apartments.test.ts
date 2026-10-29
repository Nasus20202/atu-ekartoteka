import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAvailableApartments } from '@/app/admin/users/use-available-apartments';
import type { UserDto } from '@/lib/types/dto/user-dto';

const selectedUser = { id: 'u1', apartments: [] } as unknown as UserDto;
const apartment = { id: 'apt-1', userId: null, isActive: true };

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('useAvailableApartments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads nothing without a selected user', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailableApartments(null));

    expect(result.current).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads apartments, tolerating user lists without users', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json(true, { apartments: [apartment] }))
        .mockResolvedValueOnce(json(true, {}))
        .mockResolvedValueOnce(json(true, {}))
    );

    const { result } = renderHook(() => useAvailableApartments(selectedUser));

    await waitFor(() => expect(result.current).toHaveLength(1));
  });

  it('stops when the apartments request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(false, { error: 'x' }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailableApartments(selectedUser));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(result.current).toEqual([]);
  });

  it('logs network errors', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    renderHook(() => useAvailableApartments(selectedUser));

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it('ignores results that arrive after unmount', async () => {
    let resolveUsers: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json(true, { apartments: [apartment] }))
        .mockReturnValueOnce(new Promise((r) => (resolveUsers = r)))
        .mockResolvedValueOnce(json(true, { users: [] }))
    );

    const { result, unmount } = renderHook(() =>
      useAvailableApartments(selectedUser)
    );
    await act(async () => {});
    unmount();
    await act(async () => resolveUsers(json(true, { users: [] })));

    expect(result.current).toEqual([]);
  });
});
