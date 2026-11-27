'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';

import type { AssociationStatsState } from '@/components/import/types';
import type { AdminStatsDto } from '@/lib/admin/dto/database-stats-dto';
import {
  ASSOCIATIONS_QUERY_PARAM,
  ASSOCIATIONS_QUERY_VALUE,
} from '@/lib/admin/rules/stats-query';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';

const STATS_URL = '/api/admin/stats';
const STATS_WITH_ASSOCIATIONS_URL = `${STATS_URL}?${ASSOCIATIONS_QUERY_PARAM}=${ASSOCIATIONS_QUERY_VALUE}`;

/**
 * Database totals on the import page. The per-association totals are part of
 * the same request once the section has been opened, and stay requested after
 * it is closed. The previous data stays on screen while the new key loads.
 */
export function useDatabaseStats() {
  const [associationsRequested, setAssociationsRequested] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<AdminStatsDto>(
    associationsRequested ? STATS_WITH_ASSOCIATIONS_URL : STATS_URL,
    fetchJson,
    { ...SWR_OPTIONS, keepPreviousData: true }
  );

  // Revalidates the current key only, so associations are read again after an
  // import only when they were requested
  const fetchStats = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const requestAssociations = useCallback(() => {
    setAssociationsRequested(true);
  }, []);

  const associationsData = data?.associations ?? null;
  const associationsMissing =
    associationsRequested && associationsData === null;
  const associations: AssociationStatsState = {
    items: associationsData,
    loading: associationsMissing && error === undefined,
    // Rows already shown stay on screen when a later refresh fails
    failed: associationsMissing && error !== undefined,
    request: requestAssociations,
  };

  return {
    dbStats: data ?? null,
    // SWR also reports loading for a new key whose previous data is still shown
    statsLoading: isLoading && data === undefined,
    associations,
    fetchStats,
  };
}
