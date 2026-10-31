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

describe('useInfiniteList', () => {
  it('loads the first page and appends further pages', async () => {
    const fetchPage = vi.fn(async (page: number) =>
      pageOf(page, [`a${page}`, `b${page}`], 2)
    );
    const { result } = renderList(fetchPage);

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.map(getId)).toEqual(['a1', 'b1']);
    expect(result.current.total).toBe(9);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    expect(result.current.loadingMore).toBe(true);
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(result.current.items.map(getId)).toEqual(['a1', 'b1', 'a2', 'b2']);
    expect(result.current.hasMore).toBe(false);
    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('drops items that were already loaded', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a', 'b']))
      .mockResolvedValueOnce(pageOf(2, ['b', 'c']));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.items.map(getId)).toEqual(['a', 'b', 'c']);
  });

  it('requests a page only once while it is in flight', async () => {
    const second = deferred<InfinitePage<Item>>();
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockReturnValueOnce(second.promise);
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);

    await act(async () => second.resolve(pageOf(2, ['b'])));
    expect(result.current.items.map(getId)).toEqual(['a', 'b']);
  });

  it('keeps the loaded items visible while a changed query loads', async () => {
    const next = deferred<InfinitePage<Item>>();
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['x1', 'x2']))
      .mockReturnValueOnce(next.promise);
    const { result, rerender } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ key: 'q2' });
    expect(result.current.loading).toBe(false);
    expect(result.current.items.map(getId)).toEqual(['x1', 'x2']);
    expect(result.current.total).toBe(9);

    await act(async () => next.resolve(pageOf(1, ['y1'])));
    expect(result.current.items.map(getId)).toEqual(['y1']);
    expect(fetchPage).toHaveBeenLastCalledWith(1, expect.any(AbortSignal));
  });

  it('shows the loading state when a query changes before anything loaded', async () => {
    const first = deferred<InfinitePage<Item>>();
    const second = deferred<InfinitePage<Item>>();
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderList(fetchPage);
    expect(result.current.loading).toBe(true);

    rerender({ key: 'q2' });
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('ignores a response for an outdated query', async () => {
    const stale = deferred<InfinitePage<Item>>();
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(pageOf(1, ['fresh']));
    const { result, rerender } = renderList(fetchPage);

    rerender({ key: 'q2' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => stale.resolve(pageOf(1, ['stale'])));

    expect(result.current.items.map(getId)).toEqual(['fresh']);
  });

  it('ignores a failure of an outdated query', async () => {
    let rejectStale: (reason: unknown) => void = () => {};
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(new Promise((_, reject) => (rejectStale = reject)))
      .mockResolvedValueOnce(pageOf(1, ['fresh']));
    const { result, rerender } = renderList(fetchPage);

    rerender({ key: 'q2' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => rejectStale(new Error('aborted')));

    expect(result.current.error).toBeNull();
    expect(result.current.items.map(getId)).toEqual(['fresh']);
  });

  it('keeps loaded items on failure and retries the same page', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pageOf(1, ['a']))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(pageOf(2, ['b']));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.error).toBe(LOAD_MORE_FAILED));
    expect(result.current.items.map(getId)).toEqual(['a']);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(fetchPage).toHaveBeenLastCalledWith(2, expect.any(AbortSignal));
    expect(result.current.items.map(getId)).toEqual(['a', 'b']);
  });

  it('lets the first page be retried after it fails', async () => {
    const fetchPage = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(pageOf(1, ['a'], 1));
    const { result } = renderList(fetchPage);
    await waitFor(() => expect(result.current.error).toBe(LOAD_MORE_FAILED));
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasMore).toBe(false);
  });
});
