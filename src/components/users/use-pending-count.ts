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

/** Number of pending accounts, counted by the database. */
export function usePendingCount() {
  const [pendingCount, setPendingCount] = useState(0);
  const [version, setVersion] = useState(0);

  useEffect(() => {
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
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { pendingCount, reload };
}
