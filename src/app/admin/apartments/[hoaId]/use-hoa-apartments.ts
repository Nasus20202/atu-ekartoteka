'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { PaginationData } from '@/app/admin/apartments/[hoaId]/apartments-pagination';
import type {
  ApartmentSummaryDto,
  HomeownersAssociationSummaryDto,
} from '@/lib/types/dto/apartment-dto';

const PAGE_SIZE = 20;

/** Loads one page of a HOA's apartments, driven by the URL query. */
export function useHoaApartments(hoaId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const activeOnly = searchParams.get('activeOnly') === 'true';

  const [apartments, setApartments] = useState<ApartmentSummaryDto[]>([]);
  const [hoa, setHoa] = useState<HomeownersAssociationSummaryDto | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadApartments() {
      try {
        const urlParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search,
          activeOnly: activeOnly.toString(),
          hoaId,
        });

        const response = await fetch(`/api/admin/apartments?${urlParams}`);
        const data = await response.json();

        if (!cancelled && response.ok) {
          setApartments(data.apartments);
          setPagination(data.pagination);
          if (data.hoa) {
            setHoa(data.hoa);
          }
        }
      } catch (error) {
        console.error('Failed to fetch apartments:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadApartments();

    return () => {
      cancelled = true;
    };
  }, [page, pagination.limit, search, activeOnly, hoaId]);

  const updateURL = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    const nextQuery = newParams.toString();
    if (nextQuery !== searchParams.toString()) {
      setLoading(true);
      router.push(`?${nextQuery}`, { scroll: false });
    }
  };

  return {
    apartments,
    hoa,
    pagination,
    loading,
    search,
    activeOnly,
    updateURL,
  };
}
