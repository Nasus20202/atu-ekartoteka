import { renderHook } from '@testing-library/react';

import {
  type InfinitePage,
  type PageFetcher,
  useInfiniteList,
} from '@/hooks/use-infinite-list';

export interface Item {
  id: string;
}

export const getId = (item: Item) => item.id;

export function pageOf(
  page: number,
  ids: string[],
  totalPages = 3
): InfinitePage<Item> {
  return { items: ids.map((id) => ({ id })), page, totalPages, total: 9 };
}

let renderCount = 0;

/** A request still pending in an earlier test is shared by SWR per key, so each render gets its own keys. */
export function renderList(fetchPage: PageFetcher<Item>, queryKey = 'q1') {
  const run = ++renderCount;
  return renderHook(
    ({ key }) =>
      useInfiniteList({ fetchPage, queryKey: `${run}:${key}`, getId }),
    { initialProps: { key: queryKey } }
  );
}

export function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
