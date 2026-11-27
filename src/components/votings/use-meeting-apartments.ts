'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';
import type { MeetingApartmentDto } from '@/lib/voting/dto/meeting-apartment-dto';

export const APARTMENT_SEARCH_DEBOUNCE_MS = 200;
const KEY = 'voting-meeting-apartments';

async function fetchApartments([, votingId, search]: readonly [
  string,
  string,
  string,
]): Promise<MeetingApartmentDto[]> {
  const data = await fetchJson<{ apartments: MeetingApartmentDto[] }>(
    `/api/admin/votings/${votingId}/apartments?${new URLSearchParams({ search })}`
  );
  return data.apartments;
}

/** Apartments without a ballot that match a typed text, searched by the database. */
export function useMeetingApartments(votingId: string) {
  const [search, setSearch] = useState('');
  const term = search.trim();
  const debounced = useDebouncedValue(term, APARTMENT_SEARCH_DEBOUNCE_MS);
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR(
    [KEY, votingId, debounced] as const,
    fetchApartments,
    { ...SWR_OPTIONS, keepPreviousData: true }
  );

  return {
    search,
    setSearch,
    options: data ?? [],
    // The options on screen do not answer the typed text yet
    pending: term !== debounced || isLoading,
    failed: error !== undefined,
    /** Reads every search again, after a ballot was added or removed */
    refresh: () =>
      mutate((key) => Array.isArray(key) && key[0] === KEY, undefined),
  } as const;
}
