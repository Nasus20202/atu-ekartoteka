'use client';

import { useCallback } from 'react';
import useSWR from 'swr';

import { AccountStatus } from '@/lib/auth/types/account';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';

const PENDING_COUNT_URL = `/api/admin/users?${new URLSearchParams({
  status: AccountStatus.PENDING,
  limit: '1',
})}`;

interface PendingCountResponse {
  pagination?: { total?: number };
}

async function fetchPendingCount(url: string): Promise<number> {
  const data = await fetchJson<PendingCountResponse>(url);
  return data.pagination?.total ?? 0;
}

/**
 * Number of pending accounts, counted by the database. `initialCount` is the
 * count the server already loaded, so the mount does not request it again.
 */
export function usePendingCount(initialCount?: number) {
  const { data, mutate } = useSWR(PENDING_COUNT_URL, fetchPendingCount, {
    ...SWR_OPTIONS,
    fallbackData: initialCount,
    revalidateOnMount: initialCount === undefined ? undefined : false,
  });

  const reload = useCallback(() => {
    void mutate();
  }, [mutate]);

  return { pendingCount: data ?? 0, reload };
}
