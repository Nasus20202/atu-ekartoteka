'use client';

import { useEffect, useState } from 'react';

import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

const APARTMENT_FETCH_LIMIT = 100000;
const SEARCH_DEBOUNCE_MS = 300;

/** Apartments the selected user can be assigned, filtered by the database. */
export function useAvailableApartments(
  selectedUser: UserDto | null,
  search: string
) {
  const [apartments, setApartments] = useState<ApartmentSummaryDto[]>([]);
  const userId = selectedUser?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: String(APARTMENT_FETCH_LIMIT),
          activeOnly: 'false',
          assignableTo: userId,
        });
        if (search.trim()) {
          params.set('search', search.trim());
        }

        const response = await fetch(`/api/admin/apartments?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!controller.signal.aborted) {
          setApartments(data.apartments);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch apartments:', error);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [userId, search]);

  return apartments;
}
