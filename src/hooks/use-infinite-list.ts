'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSWRConfig } from 'swr';
import useSWRInfinite, { unstable_serialize } from 'swr/infinite';

import { SWR_OPTIONS } from '@/lib/swr/swr-options';

export const LOAD_MORE_FAILED = 'Nie udało się wczytać kolejnych pozycji';

const FIRST_PAGE = 1;

export interface InfinitePage<T> {
  items: T[];
  page: number;
  totalPages: number;
  total?: number;
}

export type PageFetcher<T> = (page: number) => Promise<InfinitePage<T>>;

interface UseInfiniteListOptions<T> {
  fetchPage: PageFetcher<T>;
  queryKey: string;
  getId: (item: T) => string;
  /** First page of `queryKey` loaded on the server, so the mount does not fetch it. */
  initialPage?: InfinitePage<T>;
}

type PageKey = readonly [string, number];

function mergeUnique<T>(items: T[], getId: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = getId(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Accumulates pages of a paginated API; starts over whenever `queryKey` changes. */
export function useInfiniteList<T>({
  fetchPage,
  queryKey,
  getId,
  initialPage,
}: UseInfiniteListOptions<T>) {
  const { mutate: mutateCache } = useSWRConfig();
  const [initialKey] = useState(() =>
    initialPage !== undefined ? queryKey : null
  );
  const fetchRef = useRef(fetchPage);

  useLayoutEffect(() => {
    fetchRef.current = fetchPage;
  });

  const getKey = useCallback(
    (index: number, previous: InfinitePage<T> | null): PageKey | null =>
      previous && previous.page >= previous.totalPages
        ? null
        : [queryKey, index + FIRST_PAGE],
    [queryKey]
  );

  // Loading more must not request the server-loaded first page again, so it is
  // put where SWR looks for the pages it already has.
  useEffect(() => {
    if (initialPage === undefined || initialKey === null) return;
    void mutateCache([initialKey, FIRST_PAGE], initialPage, {
      revalidate: false,
    });
    void mutateCache(unstable_serialize(getKey), [initialPage], {
      revalidate: false,
    });
    // Only the page the list mounted with is seeded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startsFromServer = initialPage !== undefined && queryKey === initialKey;

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<InfinitePage<T>>(
      getKey,
      ([, page]: PageKey) => fetchRef.current(page),
      {
        ...SWR_OPTIONS,
        fallbackData: startsFromServer ? [initialPage] : undefined,
        revalidateOnMount: startsFromServer ? false : undefined,
        revalidateFirstPage: false,
        keepPreviousData: true,
      }
    );

  const pages = (data ?? []).filter((page) => page !== undefined);
  const items = mergeUnique(
    pages.flatMap((page) => page.items),
    getId
  );
  const last = pages[pages.length - 1];
  const loading = isLoading && items.length === 0;
  // A first page that failed can be requested again like any later page
  const hasMore =
    !isLoading &&
    (last === undefined ? error !== undefined : last.page < last.totalPages);
  const loadingMore = !isLoading && isValidating && size > pages.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    void setSize(pages.length + 1);
  }, [hasMore, loadingMore, pages.length, setSize]);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    items,
    total: last?.total ?? null,
    loading,
    loadingMore,
    hasMore,
    error: error ? LOAD_MORE_FAILED : null,
    loadMore,
    refresh,
  };
}
