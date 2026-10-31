import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildAddressKey,
  computeDuplicateActiveAddresses,
} from '@/app/admin/apartments/[hoaId]/apartment-list-utils';
import { useHoaApartments } from '@/app/admin/apartments/[hoaId]/use-hoa-apartments';

const { push, searchParams } = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams.current,
}));

const hoa = { id: 'hoa-1', externalId: 'W1', name: 'Wspólnota' };

const apartment = (id: string, number = id) => ({
  id,
  address: 'Testowa',
  building: 'A',
  number,
  isActive: true,
});

function pageBody(page: number, ids: string[], totalPages = 2) {
  return {
    apartments: ids.map((id) => apartment(id)),
    pagination: { page, limit: 20, total: 21, totalPages },
    hoa,
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

const requestedUrl = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  fetchMock.mock.calls[call][0];

describe('useHoaApartments', () => {
  beforeEach(() => {
    push.mockClear();
    searchParams.current = new URLSearchParams('search=17&activeOnly=true');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the first page for the query in the URL', async () => {
    const fetchMock = stubFetch(pageBody(1, ['apt-1']));

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(requestedUrl(fetchMock)).toBe(
      '/api/admin/apartments?page=1&limit=20&search=17&activeOnly=true&hoaId=hoa-1'
    );
    expect(result.current.apartments.map((a) => a.id)).toEqual(['apt-1']);
    expect(result.current.total).toBe(21);
    expect(result.current.hoa).toEqual(hoa);
    expect(result.current.search).toBe('17');
    expect(result.current.activeOnly).toBe(true);
  });

  it('ignores a legacy page parameter', async () => {
    searchParams.current = new URLSearchParams('page=3');
    const fetchMock = stubFetch(pageBody(1, ['apt-1']));

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(requestedUrl(fetchMock)).toBe(
      '/api/admin/apartments?page=1&limit=20&search=&activeOnly=false&hoaId=hoa-1'
    );
  });

  it('appends the next page and highlights duplicates across pages', async () => {
    const fetchMock = stubFetch(pageBody(1, ['apt-1']), {
      ...pageBody(2, []),
      apartments: [apartment('apt-2', 'apt-1')],
    });
    const { result } = renderHook(() => useHoaApartments('hoa-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.apartments).toHaveLength(2));

    expect(requestedUrl(fetchMock, 1)).toContain('page=2');
    expect(result.current.hasMore).toBe(false);
    expect([
      ...computeDuplicateActiveAddresses(result.current.apartments),
    ]).toEqual([buildAddressKey(apartment('apt-1'))]);
  });

  it('restarts from the first page when the search changes', async () => {
    const fetchMock = stubFetch(
      pageBody(1, ['apt-1']),
      pageBody(1, ['apt-9'], 1)
    );
    const { result, rerender } = renderHook(() => useHoaApartments('hoa-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    searchParams.current = new URLSearchParams('search=9');
    rerender();

    await waitFor(() =>
      expect(result.current.apartments.map((a) => a.id)).toEqual(['apt-9'])
    );
    expect(requestedUrl(fetchMock, 1)).toContain('page=1&limit=20&search=9');
  });

  it('sends the chosen sort to the API', async () => {
    const fetchMock = stubFetch(pageBody(1, ['apt-1']), pageBody(1, ['apt-1']));
    const { result } = renderHook(() => useHoaApartments('hoa-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSort({ key: 'owner', direction: 'desc' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(requestedUrl(fetchMock, 1)).toContain('sort=owner&order=desc');
  });

  it('keeps the HOA unset when the response has none', async () => {
    stubFetch({ ...pageBody(1, []), hoa: null });

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hoa).toBeNull();
  });

  it('reports a failed response as a load error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.apartments).toEqual([]);
  });

  it('pushes changed query params without a page and skips unchanged ones', () => {
    stubFetch(pageBody(1, []));
    searchParams.current = new URLSearchParams('page=2&search=17');
    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    act(() => result.current.updateURL({ search: '', activeOnly: 'true' }));
    expect(push).toHaveBeenCalledWith('?activeOnly=true', { scroll: false });

    push.mockClear();
    searchParams.current = new URLSearchParams('search=17');
    const second = renderHook(() => useHoaApartments('hoa-1'));
    act(() => second.result.current.updateURL({ search: '17' }));
    expect(push).not.toHaveBeenCalled();
  });
});
