import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  deferred,
  getId,
  type Item,
  pageOf,
  renderList,
} from '@/__tests__/fixtures/infinite-list';
import {
  type InfinitePage,
  LOAD_MORE_FAILED,
} from '@/lib/hooks/use-infinite-list';

describe('useInfiniteList refresh', () => {
  it('refreshes every loaded page in place', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a', 'b']))
      .mockResolvedValueOnce(pageOf(2, ['c', 'd']))
      .mockResolvedValueOnce(pageOf(1, ['a', 'c']))
      .mockResolvedValueOnce(pageOf(2, ['d', 'e']));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(4));

    await act(() => result.current.refresh());

    expect(fetchPage).toHaveBeenCalledTimes(4);
    expect(result.current.items.map(getId)).toEqual(['a', 'c', 'd', 'e']);
    expect(result.current.hasMore).toBe(true);
  });

  it('reports a failed refresh and keeps the items', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockRejectedValueOnce(new Error('offline'));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refresh());

    expect(result.current.error).toBe(LOAD_MORE_FAILED);
    expect(result.current.items.map(getId)).toEqual(['a']);
  });

  it('drops a page that was still loading when the list refreshed', async () => {
    const third = deferred<InfinitePage<Item>>();
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockResolvedValueOnce(pageOf(2, ['b']))
      .mockReturnValueOnce(third.promise)
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockResolvedValueOnce(pageOf(2, ['b']));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => result.current.loadMore());
    expect(result.current.loadingMore).toBe(true);

    await act(() => result.current.refresh());
    await act(async () => third.resolve(pageOf(3, ['c'])));

    expect(result.current.items.map(getId)).toEqual(['a', 'b']);
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it('accepts more pages once a refresh has finished', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockResolvedValueOnce(pageOf(2, ['b']));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refresh());
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(fetchPage).toHaveBeenLastCalledWith(2, expect.any(AbortSignal));
  });
});
