'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

const APARTMENT_FETCH_LIMIT = 100000;
const SEARCH_DEBOUNCE_MS = 300;
const NO_APARTMENTS: ApartmentSummaryDto[] = [];

type AvailableApartmentsKey = readonly [string, string, string];

interface AvailableApartments {
  userId: string;
  apartments: ApartmentSummaryDto[];
}

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

  const data = await fetchJson<{ apartments: ApartmentSummaryDto[] }>(
    `/api/admin/apartments?${params}`
  );
  return { userId, apartments: data.apartments };
}

function useDebounced(value: string): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return debounced;
}

/** Apartments the selected user can be assigned, filtered by the database. */
export function useAvailableApartments(
  selectedUser: UserDto | null,
  search: string
) {
  const userId = selectedUser?.id;
  const debouncedSearch = useDebounced(search.trim());

  const { data } = useSWR(
    userId
      ? (['available-apartments', userId, debouncedSearch] as const)
      : null,
    fetchAvailableApartments,
    { ...SWR_OPTIONS, keepPreviousData: true }
  );

  // Another user's list is never shown, even while the new one loads.
  return data && data.userId === userId ? data.apartments : NO_APARTMENTS;
}
