import { renderHook } from '@testing-library/react';

import {
  type InfinitePage,
  type PageFetcher,
  useInfiniteList,
} from '@/lib/hooks/use-infinite-list';

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

export function renderList(fetchPage: PageFetcher<Item>, queryKey = 'q1') {
  return renderHook(
    ({ key }) => useInfiniteList({ fetchPage, queryKey: key, getId }),
    { initialProps: { key: queryKey } }
  );
}

export function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
