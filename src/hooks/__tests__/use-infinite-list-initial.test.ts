import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getId, type Item, pageOf } from '@/__tests__/fixtures/infinite-list';
import { type PageFetcher, useInfiniteList } from '@/hooks/use-infinite-list';

function renderWithInitial(fetchPage: PageFetcher<Item>, queryKey = 'q1') {
  return renderHook(
    ({ key }) =>
      useInfiniteList({
        fetchPage,
        queryKey: key,
        getId,
        initialPage: pageOf(1, ['a', 'b']),
      }),
    { initialProps: { key: queryKey } }
  );
}

describe('useInfiniteList with an initial page', () => {
  it('shows the initial page at once and does not fetch it', async () => {
    const fetchPage = vi.fn();
    const { result } = renderWithInitial(fetchPage);

    expect(result.current.loading).toBe(false);
    expect(result.current.items.map(getId)).toEqual(['a', 'b']);
    expect(result.current.total).toBe(9);
    expect(result.current.hasMore).toBe(true);
    await waitFor(() => expect(fetchPage).not.toHaveBeenCalled());
  });

  it('loads the next page after the initial one', async () => {
    const fetchPage = vi.fn(async (page: number) => pageOf(page, ['c', 'd']));
    const { result } = renderWithInitial(fetchPage);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(fetchPage).toHaveBeenCalledWith(2, expect.any(AbortSignal));
    expect(result.current.items.map(getId)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('fetches the first page again once the query changes', async () => {
    const fetchPage = vi.fn(async (page: number) => pageOf(page, ['x']));
    const { result, rerender } = renderWithInitial(fetchPage);

    rerender({ key: 'q2' });

    await waitFor(() =>
      expect(fetchPage).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    );
    await waitFor(() => expect(result.current.items.map(getId)).toEqual(['x']));
  });
});
