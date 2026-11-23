import {
  act,
  renderHook,
  type RenderHookResult,
  waitFor,
} from '@testing-library/react';
import { createElement, Suspense } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type AvailableApartments,
  useAvailableApartments,
} from '@/components/users/use-available-apartments';
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

function withSuspense({ children }: { children: React.ReactNode }) {
  return createElement(Suspense, { fallback: null }, children);
}

/** Renders inside async act so a suspended first load can resolve. */
async function renderAvailable(props: Props) {
  let rendered!: RenderHookResult<AvailableApartments, Props>;
  await act(async () => {
    rendered = renderHook(
      ({ user, search }) => useAvailableApartments(user, search),
      { initialProps: props, wrapper: withSuspense }
    );
  });
  return rendered;
}

describe('useAvailableApartments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads nothing without a selected user', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = await renderAvailable({ user: null, search: '' });

    expect(result.current).toEqual({ apartments: [], failed: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('suspends until the apartments assignable to the user arrive', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json(true, { apartments: [apartment] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = await renderAvailable({
      user: selectedUser,
      search: '',
    });

    expect(result.current.apartments).toHaveLength(1);
    expect(result.current.failed).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(requestedParams(fetchMock).get('assignableTo')).toBe('u1');
    expect(requestedParams(fetchMock).has('search')).toBe(false);
  });

  it('sends the debounced search to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(true, { apartments: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = await renderAvailable({
      user: selectedUser,
      search: '',
    });
    await act(async () => {
      rerender({ user: selectedUser, search: ' 17/12 ' });
    });

    await waitFor(
      () => expect(requestedParams(fetchMock).get('search')).toBe('17/12'),
      { timeout: SEARCH_WAIT_MS }
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.apartments).toEqual([]);
  });

  it('reports a failed request instead of throwing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(false, { error: 'x' }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = await renderAvailable({
      user: selectedUser,
      search: '',
    });

    expect(result.current).toEqual({ apartments: [], failed: true });
  });
});
