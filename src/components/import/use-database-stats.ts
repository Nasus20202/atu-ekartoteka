'use client';

import { useCallback } from 'react';
import useSWR from 'swr';

import type { DatabaseStats } from '@/components/import/types';
import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';

const STATS_URL = '/api/admin/stats';

/** Database totals shown above the import form, refreshable after imports. */
export function useDatabaseStats() {
  const { data, isLoading, mutate } = useSWR<DatabaseStats>(
    STATS_URL,
    fetchJson,
    SWR_OPTIONS
  );

  const fetchStats = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return { dbStats: data ?? null, statsLoading: isLoading, fetchStats };
}
