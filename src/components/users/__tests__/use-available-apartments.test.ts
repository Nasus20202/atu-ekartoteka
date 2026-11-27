import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAvailableApartments } from '@/components/users/use-available-apartments';
import type { UserDto } from '@/lib/users/dto/user-dto';

const selectedUser = { id: 'u1', apartments: [] } as unknown as UserDto;
const apartment = { id: 'apt-1', userId: null, isActive: true };

const SEARCH_WAIT_MS = 3000;

interface Props {
  user: UserDto | null;
  search: string;
}

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

function requestedParams(fetchMock: ReturnType<typeof vi.fn>) {
  const url = String(fetchMock.mock.calls.at(-1)?.[0]);
  return new URL(url, 'http://localhost').searchParams;
}

function renderAvailable(props: Props) {
  return renderHook(
    ({ user, search }) => useAvailableApartments(user, search),
    { initialProps: props }
  );
}

describe('useAvailableApartments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads nothing without a selected user', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderAvailable({ user: null, search: '' });

    expect(result.current).toEqual({
      apartments: [],
      failed: false,
      loading: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads the apartments assignable to the user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json(true, { apartments: [apartment] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderAvailable({ user: selectedUser, search: '' });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.apartments).toHaveLength(1);
    expect(result.current.failed).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(requestedParams(fetchMock).get('assignableTo')).toBe('u1');
    expect(requestedParams(fetchMock).has('search')).toBe(false);
  });

  it('keeps the previous list while a debounced search loads', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(true, { apartments: [apartment] }))
      .mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const { result, rerender } = renderAvailable({
      user: { ...selectedUser, id: 'u2' },
      search: '',
    });
    await waitFor(() => expect(result.current.apartments).toHaveLength(1));

    await act(async () => {
      rerender({ user: { ...selectedUser, id: 'u2' }, search: ' 17/12 ' });
    });

    await waitFor(
      () => expect(requestedParams(fetchMock).get('search')).toBe('17/12'),
      { timeout: SEARCH_WAIT_MS }
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.apartments).toHaveLength(1);
  });

  it('reports a failed request instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json(false, { error: 'x' }))
    );

    const { result } = renderAvailable({
      user: { ...selectedUser, id: 'u3' },
      search: '',
    });

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current).toEqual({
      apartments: [],
      failed: true,
      loading: false,
    });
  });
});
