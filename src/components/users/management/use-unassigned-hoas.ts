import { useCallback } from 'react';

import {
  type BulkMode,
  fetchUnassignedHoas,
} from '@/components/users/management/bulk-requests';
import type { HoaGroup } from '@/components/users/management/hoa-card';
import { type PageFetcher, useInfiniteList } from '@/hooks/use-infinite-list';

const getHoaId = (hoa: HoaGroup) => hoa.hoaId;

export function useUnassignedHoas(mode: BulkMode) {
  const fetchPage = useCallback<PageFetcher<HoaGroup>>(
    async (page) => {
      const result = await fetchUnassignedHoas(mode, page);
      if (result.error !== undefined) throw new Error(result.error);
      return {
        items: result.data.hoas,
        page: result.data.page,
        totalPages: result.data.totalPages,
      };
    },
    [mode]
  );

  const list = useInfiniteList({ fetchPage, queryKey: mode, getId: getHoaId });

  return { ...list, hoas: list.items };
}
