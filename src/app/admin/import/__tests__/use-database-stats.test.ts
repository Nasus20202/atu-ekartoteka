import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDatabaseStats } from '@/app/admin/import/use-database-stats';

describe('useDatabaseStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads stats and keeps them on a failed refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: 3 }),
        })
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
    await act(async () =>
      resolve({ ok: true, json: () => Promise.resolve({ users: 1 }) })
    );

    expect(result.current.dbStats).toBeNull();
    expect(result.current.statsLoading).toBe(true);
  });
});
