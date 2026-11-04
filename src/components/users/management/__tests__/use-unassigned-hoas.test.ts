import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUnassignedHoas } from '@/components/users/management/use-unassigned-hoas';
import { LOAD_MORE_FAILED } from '@/hooks/use-infinite-list';

/** A fresh cache per test, so one test's pages are not seen by the next. */
function freshCache({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    { value: { provider: () => new Map() } },
    children
  );
}

function hoasBody(ids: string[], page = 1, totalPages = 1) {
  return {
    hoas: ids.map((hoaId) => ({ hoaId })),
    pagination: { page, limit: 10, total: ids.length, totalPages },
  };
}

function stubFetch(...responses: Array<{ ok: boolean; body: object }>) {
  const fetchMock = vi.fn();
  for (const { ok, body } of responses) {
    fetchMock.mockResolvedValueOnce({
      ok,
      json: () => Promise.resolve(body),
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useUnassignedHoas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads HOAs for the assign mode', async () => {
    const fetchMock = stubFetch({ ok: true, body: hoasBody(['h1']) });

    const { result } = renderHook(() => useUnassignedHoas('assign'), {
      wrapper: freshCache,
    });

    await waitFor(() => expect(result.current.hoas).toHaveLength(1));
    expect(result.current.hoas[0]).toEqual({ hoaId: 'h1' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/unassigned-apartments?mode=assignable&page=1'
    );
  });

  it('requests the creatable HOAs in create mode', async () => {
    const fetchMock = stubFetch({ ok: true, body: hoasBody(['h1']) });

    renderHook(() => useUnassignedHoas('create'), { wrapper: freshCache });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/unassigned-apartments?mode=creatable&page=1'
    );
  });

  it('appends the next page', async () => {
    const fetchMock = stubFetch(
      { ok: true, body: hoasBody(['h1'], 1, 2) },
      { ok: true, body: hoasBody(['h2'], 2, 2) }
    );

    const { result } = renderHook(() => useUnassignedHoas('create'), {
      wrapper: freshCache,
    });

    await waitFor(() => expect(result.current.hoas).toHaveLength(1));
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => expect(result.current.hoas).toHaveLength(2));
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/admin/unassigned-apartments?mode=creatable&page=2'
    );
  });

  it('reports a failed load as the list message', async () => {
    stubFetch({ ok: false, body: { error: 'Brak uprawnień' } });

    const { result } = renderHook(() => useUnassignedHoas('create'), {
      wrapper: freshCache,
    });

    await waitFor(() => expect(result.current.error).toBe(LOAD_MORE_FAILED));
  });
});
