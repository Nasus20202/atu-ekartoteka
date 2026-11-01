'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import {
  type PageFetcher,
  useInfiniteList,
} from '@/lib/hooks/use-infinite-list';
import type {
  ApartmentSummaryDto,
  HomeownersAssociationNoticeDto,
} from '@/lib/types/dto/apartment-dto';
import type { ApartmentSortKey, SortState } from '@/lib/utils/sort';

const PAGE_SIZE = 20;

const getApartmentId = (apartment: ApartmentSummaryDto) => apartment.id;

/** Infinitely scrolled list of a HOA's apartments, filtered by the URL query. */
export function useHoaApartments(hoaId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const activeOnly = searchParams.get('activeOnly') === 'true';

  const [hoa, setHoa] = useState<HomeownersAssociationNoticeDto | null>(null);
  const [sort, setSort] = useState<SortState<ApartmentSortKey> | null>(null);

  const fetchPage = useCallback<PageFetcher<ApartmentSummaryDto>>(
    async (page, signal) => {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        search,
        activeOnly: activeOnly.toString(),
        hoaId,
      });
      if (sort) {
        urlParams.set('sort', sort.key);
        urlParams.set('order', sort.direction);
      }
      const response = await fetch(`/api/admin/apartments?${urlParams}`, {
        signal,
      });
      if (!response.ok) {
        throw new Error(`Apartments request failed: ${response.status}`);
      }
      const data = await response.json();
      if (data.hoa) setHoa(data.hoa);
      return { items: data.apartments, ...data.pagination };
    },
    [activeOnly, hoaId, search, sort]
  );

  const list = useInfiniteList({
    fetchPage,
    queryKey: `${hoaId}|${search}|${activeOnly}|${sort?.key ?? ''}|${sort?.direction ?? ''}`,
    getId: getApartmentId,
  });

  const updateURL = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    const nextQuery = newParams.toString();
    if (nextQuery !== searchParams.toString()) {
      router.push(`?${nextQuery}`, { scroll: false });
    }
  };

  return {
    ...list,
    apartments: list.items,
    hoa,
    search,
    activeOnly,
    updateURL,
    sort,
    setSort,
  };
}
