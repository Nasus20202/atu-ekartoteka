'use client';

import { useCallback, useEffect, useState } from 'react';

import { AccountStatus } from '@/lib/types';

const PENDING_COUNT_QUERY = new URLSearchParams({
  status: AccountStatus.PENDING,
  limit: '1',
}).toString();

async function fetchPendingCount(): Promise<number | null> {
  const response = await fetch(`/api/admin/users?${PENDING_COUNT_QUERY}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.pagination?.total ?? 0;
}

/**
 * Number of pending accounts, counted by the database. `initialCount` is the
 * count the server already loaded, so the mount does not request it again.
 */
export function usePendingCount(initialCount?: number) {
  const [pendingCount, setPendingCount] = useState(initialCount ?? 0);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // The server already counted them for the first render
    if (initialCount !== undefined && version === 0) return;

    let cancelled = false;
    fetchPendingCount()
      .then((count) => {
        if (!cancelled && count !== null) setPendingCount(count);
      })
      .catch((error) => {
        console.error('Failed to fetch pending users count:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [version, initialCount]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { pendingCount, reload };
}
