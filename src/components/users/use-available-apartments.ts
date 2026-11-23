'use client';

import { startTransition, useEffect, useState } from 'react';
import useSWR from 'swr';

import type { ApartmentSummaryDto } from '@/lib/apartments/dto/apartment-dto';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';
import type { UserDto } from '@/lib/users/dto/user-dto';

const APARTMENT_FETCH_LIMIT = 100000;
const SEARCH_DEBOUNCE_MS = 300;
const NO_APARTMENTS: ApartmentSummaryDto[] = [];

type AvailableApartmentsKey = readonly [string, string, string];

export interface AvailableApartments {
  apartments: ApartmentSummaryDto[];
  failed: boolean;
}

const NO_APARTMENTS_RESULT: AvailableApartments = {
  apartments: NO_APARTMENTS,
  failed: false,
};

async function fetchAvailableApartments([
  ,
  userId,
  search,
]: AvailableApartmentsKey): Promise<AvailableApartments> {
  const params = new URLSearchParams({
    page: '1',
    limit: String(APARTMENT_FETCH_LIMIT),
    activeOnly: 'false',
    assignableTo: userId,
  });
  if (search) {
    params.set('search', search);
  }

  try {
    const data = await fetchJson<{ apartments: ApartmentSummaryDto[] }>(
      `/api/admin/apartments?${params}`
    );
    return { apartments: data.apartments, failed: false };
  } catch {
    // A failure is shown in the list; it is not thrown into the Suspense boundary.
    return { apartments: NO_APARTMENTS, failed: true };
  }
}

function useDebounced(value: string): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(
      () => startTransition(() => setDebounced(value)),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [value]);

  return debounced;
}

/**
 * Apartments the selected user can be assigned, filtered by the database.
 * Suspends until the first list for the user arrives; a new search keeps the
 * previous list on screen while the next one loads.
 */
export function useAvailableApartments(
  selectedUser: UserDto | null,
  search: string
): AvailableApartments {
  const userId = selectedUser?.id;
  const debouncedSearch = useDebounced(search.trim());

  const { data } = useSWR(
    userId
      ? (['available-apartments', userId, debouncedSearch] as const)
      : null,
    fetchAvailableApartments,
    { ...SWR_OPTIONS, suspense: true }
  );

  return data ?? NO_APARTMENTS_RESULT;
}
