'use client';

import { useEffect, useState } from 'react';

import type { DatabaseStats } from '@/app/admin/import/types';

/** Database totals shown above the import form, refreshable after imports. */
export function useDatabaseStats() {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  async function fetchStats(
    options: { isCancelled?: () => boolean; skipLoading?: boolean } = {}
  ) {
    try {
      if (!options.skipLoading) {
        setStatsLoading(true);
      }
      const res = await fetch('/api/admin/stats');

      if (res.ok && !options.isCancelled?.()) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch {
      // Ignore stats errors
    } finally {
      if (!options.isCancelled?.()) {
        setStatsLoading(false);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      await fetchStats({ isCancelled: () => cancelled, skipLoading: true });
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return { dbStats, statsLoading, fetchStats };
}
