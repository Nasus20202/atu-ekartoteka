import { useEffect, useState } from 'react';

import {
  type BulkMode,
  fetchUnassignedHoas,
  type UnassignedHoasPage,
} from '@/app/admin/users/management/bulk-requests';

const FIRST_PAGE: UnassignedHoasPage = { hoas: [], page: 0, totalPages: 0 };

export function useUnassignedHoas(mode: BulkMode) {
  const [loaded, setLoaded] = useState(FIRST_PAGE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPage = (
    result: Awaited<ReturnType<typeof fetchUnassignedHoas>>,
    append: boolean
  ) => {
    if (result.error === undefined) {
      setLoaded((previous) => ({
        ...result.data,
        hoas: append
          ? [...previous.hoas, ...result.data.hoas]
          : result.data.hoas,
      }));
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    void fetchUnassignedHoas(mode).then((result) => {
      if (!cancelled) applyPage(result, false);
    });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const reset = () => {
    setLoading(true);
    setLoaded(FIRST_PAGE);
    setError(null);
  };

  const reload = async (nextMode: BulkMode) => {
    reset();
    applyPage(await fetchUnassignedHoas(nextMode), false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    applyPage(await fetchUnassignedHoas(mode, loaded.page + 1), true);
    setLoadingMore(false);
  };

  return {
    hoas: loaded.hoas,
    hasMore: loaded.page < loaded.totalPages,
    loading,
    loadingMore,
    error,
    reset,
    reload,
    loadMore,
  };
}
