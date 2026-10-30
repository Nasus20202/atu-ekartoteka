import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAvailableApartments } from '@/app/admin/users/use-available-apartments';
import type { UserDto } from '@/lib/types/dto/user-dto';

const selectedUser = { id: 'u1', apartments: [] } as unknown as UserDto;
const apartment = { id: 'apt-1', userId: null, isActive: true };

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

function requestedParams(fetchMock: ReturnType<typeof vi.fn>) {
  const url = String(fetchMock.mock.calls.at(-1)?.[0]);
  return new URL(url, 'http://localhost').searchParams;
}

describe('useAvailableApartments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads nothing without a selected user', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailableApartments(null, ''));

    expect(result.current).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks the API for apartments assignable to the user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json(true, { apartments: [apartment] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useAvailableApartments(selectedUser, '')
    );

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(requestedParams(fetchMock).get('assignableTo')).toBe('u1');
    expect(requestedParams(fetchMock).has('search')).toBe(false);
  });

  it('sends the debounced search to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(true, { apartments: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ search }) => useAvailableApartments(selectedUser, search),
      { initialProps: { search: '' } }
    );
    rerender({ search: ' 17/12 ' });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(requestedParams(fetchMock).get('search')).toBe('17/12');
  });

  it('keeps the list empty when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(false, { error: 'x' }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useAvailableApartments(selectedUser, '')
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(result.current).toEqual([]);
  });

  it('logs network errors', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    renderHook(() => useAvailableApartments(selectedUser, ''));

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it('ignores results that arrive after unmount', async () => {
    let resolveApartments: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((r) => (resolveApartments = r)))
    );

    const { result, unmount } = renderHook(() =>
      useAvailableApartments(selectedUser, '')
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    unmount();
    await act(async () =>
      resolveApartments(json(true, { apartments: [apartment] }))
    );

    expect(result.current).toEqual([]);
  });
});
