import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHoaApartments } from '@/app/admin/apartments/[hoaId]/use-hoa-apartments';

const { push, searchParams } = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams.current,
}));

const responseBody = {
  apartments: [{ id: 'apt-1' }],
  pagination: { page: 2, limit: 20, total: 21, totalPages: 2 },
  hoa: { id: 'hoa-1', externalId: 'W1', name: 'Wspólnota' },
};

function mockFetch(ok = true, body: object = responseBody) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useHoaApartments', () => {
  beforeEach(() => {
    push.mockClear();
    searchParams.current = new URLSearchParams(
      'page=2&search=17&activeOnly=true'
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads apartments for the query in the URL', async () => {
    const fetchMock = mockFetch();

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/apartments?page=2&limit=20&search=17&activeOnly=true&hoaId=hoa-1'
    );
    expect(result.current.apartments).toEqual(responseBody.apartments);
    expect(result.current.hoa).toEqual(responseBody.hoa);
    expect(result.current.search).toBe('17');
    expect(result.current.activeOnly).toBe(true);
  });

  it('defaults to the first page without filters', async () => {
    searchParams.current = new URLSearchParams();
    const fetchMock = mockFetch();

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/apartments?page=1&limit=20&search=&activeOnly=false&hoaId=hoa-1'
    );
  });

  it('keeps the HOA unset when the response has none', async () => {
    mockFetch(true, { ...responseBody, hoa: null });

    const { result } = renderHook(() => useHoaApartments('hoa-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hoa).toBeNull();
  });

  it('ignores failed responses and network errors', async () => {
    mockFetch(false);
    const { result } = renderHook(() => useHoaApartments('hoa-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.apartments).toEqual([]);

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const second = renderHook(() => useHoaApartments('hoa-2'));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not update state after unmount', async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    );

    const { result, unmount } = renderHook(() => useHoaApartments('hoa-1'));
    unmount();
    await act(async () => {
      resolve({ ok: true, json: () => Promise.resolve(responseBody) });
    });

    expect(result.current.loading).toBe(true);
  });

  it('pushes changed query params and skips unchanged ones', async () => {
    mockFetch();
    const { result } = renderHook(() => useHoaApartments('hoa-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.updateURL({ search: '', page: '1' }));
    expect(push).toHaveBeenCalledWith('?page=1&activeOnly=true', {
      scroll: false,
    });
    expect(result.current.loading).toBe(true);

    push.mockClear();
    act(() => result.current.updateURL({ page: '2' }));
    expect(push).not.toHaveBeenCalled();
  });
});
