'use client';

import { useCallback } from 'react';

import type { BulkMode } from '@/components/users/management/bulk-requests';
import type { HoaGroup } from '@/components/users/management/hoa-card';
import { type PageFetcher, useInfiniteList } from '@/hooks/use-infinite-list';
import { fetchJson } from '@/lib/swr/fetch-json';

const getHoaId = (hoa: HoaGroup) => hoa.hoaId;

interface UnassignedHoasResponse {
  hoas: HoaGroup[];
  pagination: { page: number; totalPages: number };
}

/** Infinitely scrolled HOAs that still have apartments to create or assign. */
export function useUnassignedHoas(mode: BulkMode) {
  const fetchPage = useCallback<PageFetcher<HoaGroup>>(
    async (page) => {
      const modeParam = mode === 'assign' ? 'assignable' : 'creatable';
      const data = await fetchJson<UnassignedHoasResponse>(
        `/api/admin/unassigned-apartments?mode=${modeParam}&page=${page}`
      );

      return {
        items: data.hoas,
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
      };
    },
    [mode]
  );

  const list = useInfiniteList({ fetchPage, queryKey: mode, getId: getHoaId });

  return { ...list, hoas: list.items };
}
