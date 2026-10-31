'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export const LOAD_MORE_FAILED = 'Nie udało się wczytać kolejnych pozycji';

const FIRST_PAGE = 1;

export interface InfinitePage<T> {
  items: T[];
  page: number;
  totalPages: number;
  total?: number;
}

export type PageFetcher<T> = (
  page: number,
  signal: AbortSignal
) => Promise<InfinitePage<T>>;

interface UseInfiniteListOptions<T> {
  fetchPage: PageFetcher<T>;
  queryKey: string;
  getId: (item: T) => string;
}

interface ListState<T> {
  key: string | null;
  items: T[];
  page: number;
  totalPages: number;
  total: number | null;
  error: string | null;
}

const EMPTY_STATE: ListState<never> = {
  key: null,
  items: [],
  page: 0,
  totalPages: 0,
  total: null,
  error: null,
};

function mergeUnique<T>(items: T[], getId: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = getId(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Accumulates pages of a paginated API; resets whenever `queryKey` changes. */
export function useInfiniteList<T>({
  fetchPage,
  queryKey,
  getId,
}: UseInfiniteListOptions<T>) {
  const [state, setState] = useState<ListState<T>>(EMPTY_STATE);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchRef = useRef(fetchPage);
  const getIdRef = useRef(getId);
  const controllerRef = useRef<AbortController | null>(null);
  const requestingRef = useRef(false);

  useLayoutEffect(() => {
    fetchRef.current = fetchPage;
    getIdRef.current = getId;
  });

  const requestPage = useCallback(
    async (page: number, key: string, signal: AbortSignal) => {
      try {
        const result = await fetchRef.current(page, signal);
        if (signal.aborted) return;
        setState((previous) => ({
          key,
          items: mergeUnique(
            [...(previous.key === key ? previous.items : []), ...result.items],
            getIdRef.current
          ),
          page: result.page,
          totalPages: result.totalPages,
          total: result.total ?? null,
          error: null,
        }));
      } catch {
        if (signal.aborted) return;
        setState((previous) =>
          previous.key === key
            ? { ...previous, error: LOAD_MORE_FAILED }
            : {
                ...EMPTY_STATE,
                key,
                totalPages: FIRST_PAGE,
                error: LOAD_MORE_FAILED,
              }
        );
      } finally {
        if (!signal.aborted) {
          requestingRef.current = false;
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Aborting the previous controller drops any response still in flight, so a
  // stale page can never land after a reset or refresh.
  const replaceController = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller;
  }, []);

  useEffect(() => {
    const controller = replaceController();
    requestingRef.current = true;
    void requestPage(FIRST_PAGE, queryKey, controller.signal);
    return () => controller.abort();
  }, [queryKey, replaceController, requestPage]);

  // While a changed query loads, the last loaded items stay visible instead of
  // collapsing the list into a loading placeholder.
  const current = state.key === queryKey ? state : null;
  const items = current ? current.items : state.items;
  const total = current ? current.total : state.total;
  const hasMore = current !== null && current.page < current.totalPages;

  const loadMore = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller || requestingRef.current || !hasMore || !current) return;
    requestingRef.current = true;
    setLoadingMore(true);
    void requestPage(current.page + 1, queryKey, controller.signal);
  }, [current, hasMore, queryKey, requestPage]);

  const refresh = useCallback(async () => {
    if (!controllerRef.current) return;
    const { signal } = replaceController();
    const loadedPages = Math.max(current?.page ?? 0, FIRST_PAGE);
    requestingRef.current = true;
    setLoadingMore(false);
    try {
      const results = await Promise.all(
        Array.from({ length: loadedPages }, (_, index) =>
          fetchRef.current(index + FIRST_PAGE, signal)
        )
      );
      if (signal.aborted) return;
      const last = results[results.length - 1];
      setState({
        key: queryKey,
        items: mergeUnique(
          results.flatMap((result) => result.items),
          getIdRef.current
        ),
        page: last.page,
        totalPages: last.totalPages,
        total: last.total ?? null,
        error: null,
      });
    } catch {
      if (!signal.aborted) {
        setState((previous) => ({ ...previous, error: LOAD_MORE_FAILED }));
      }
    } finally {
      if (!signal.aborted) requestingRef.current = false;
    }
  }, [current, queryKey, replaceController]);

  return {
    items,
    total,
    loading: current === null && items.length === 0,
    loadingMore,
    hasMore,
    error: current?.error ?? null,
    loadMore,
    refresh,
  };
}
