import { useCallback } from 'react';

import {
  type BulkMode,
  fetchUnassignedHoas,
} from '@/app/admin/users/management/bulk-requests';
import type { HoaGroup } from '@/app/admin/users/management/hoa-card';
import {
  type PageFetcher,
  useInfiniteList,
} from '@/lib/hooks/use-infinite-list';

const getHoaId = (hoa: HoaGroup) => hoa.hoaId;

export function useUnassignedHoas(mode: BulkMode) {
  const fetchPage = useCallback<PageFetcher<HoaGroup>>(
    async (page, signal) => {
      const result = await fetchUnassignedHoas(mode, page, signal);
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
