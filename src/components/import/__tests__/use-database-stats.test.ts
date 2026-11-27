import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDatabaseStats } from '@/components/import/use-database-stats';

const STATS_URL = '/api/admin/stats';
const STATS_WITH_ASSOCIATIONS_URL = '/api/admin/stats?associations=true';
const ASSOCIATIONS = [{ id: 'hoa-1', name: 'Alfa' }];

function okResponse(body: unknown) {
  return { ok: true, json: () => Promise.resolve(body) };
}

function requestedUrls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map(([url]) => url);
}

describe('useDatabaseStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads stats and keeps them on a failed refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(okResponse({ users: 3 }))
        .mockResolvedValueOnce({ ok: false })
    );

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));
    expect(result.current.dbStats).toEqual({ users: 3 });

    await act(() => result.current.fetchStats());
    expect(result.current.dbStats).toEqual({ users: 3 });
    expect(result.current.statsLoading).toBe(false);
  });

  it('ignores a response that arrives after unmount', async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    );

    const { result, unmount } = renderHook(() => useDatabaseStats());
    unmount();
    await act(async () => resolve(okResponse({ users: 1 })));

    expect(result.current.dbStats).toBeNull();
    expect(result.current.statsLoading).toBe(true);
  });

  it('requests the summary without the associations until they are requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ users: 3 }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));

    expect(requestedUrls(fetchMock)).toEqual([STATS_URL]);
    expect(result.current.associations.items).toBeNull();
    expect(result.current.associations.loading).toBe(false);
  });

  it('loads the associations with the parameter and keeps the summary on screen meanwhile', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse({ users: 3 }))
      .mockResolvedValueOnce(
        okResponse({ users: 3, associations: ASSOCIATIONS })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));

    act(() => result.current.associations.request());

    expect(result.current.associations.loading).toBe(true);
    expect(result.current.statsLoading).toBe(false);
    expect(result.current.dbStats).toEqual({ users: 3 });
    await waitFor(() =>
      expect(result.current.associations.items).toEqual(ASSOCIATIONS)
    );
    expect(requestedUrls(fetchMock)).toEqual([
      STATS_URL,
      STATS_WITH_ASSOCIATIONS_URL,
    ]);
    expect(result.current.associations.loading).toBe(false);
  });

  it('keeps the summary and reports a failure when the associations fail to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(okResponse({ users: 3 }))
        .mockResolvedValueOnce({ ok: false, status: 500 })
    );

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));

    act(() => result.current.associations.request());

    await waitFor(() => expect(result.current.associations.failed).toBe(true));
    expect(result.current.dbStats).toEqual({ users: 3 });
    expect(result.current.associations.items).toBeNull();
    expect(result.current.associations.loading).toBe(false);
  });

  it('keeps the shown associations when a later refresh fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(okResponse({ users: 3 }))
        .mockResolvedValueOnce(
          okResponse({ users: 3, associations: ASSOCIATIONS })
        )
        .mockResolvedValueOnce({ ok: false, status: 500 })
    );

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));
    act(() => result.current.associations.request());
    await waitFor(() =>
      expect(result.current.associations.items).not.toBeNull()
    );

    await act(() => result.current.fetchStats());

    expect(result.current.associations.items).toEqual(ASSOCIATIONS);
    expect(result.current.associations.failed).toBe(false);
  });

  it('reads only the summary again after an import while the associations were not requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ users: 3 }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));
    fetchMock.mockClear();

    await act(() => result.current.fetchStats());

    expect(requestedUrls(fetchMock)).toEqual([STATS_URL]);
  });

  it('reads the associations again with the summary after an import once they were requested', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse({ users: 3 }))
      .mockResolvedValueOnce(
        okResponse({ users: 3, associations: ASSOCIATIONS })
      )
      .mockResolvedValue(okResponse({ users: 4, associations: ASSOCIATIONS }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDatabaseStats());
    await waitFor(() => expect(result.current.statsLoading).toBe(false));
    act(() => result.current.associations.request());
    await waitFor(() =>
      expect(result.current.associations.items).not.toBeNull()
    );
    fetchMock.mockClear();

    await act(() => result.current.fetchStats());

    expect(requestedUrls(fetchMock)).toEqual([STATS_WITH_ASSOCIATIONS_URL]);
    expect(result.current.dbStats).toEqual({
      users: 4,
      associations: ASSOCIATIONS,
    });
  });
});
