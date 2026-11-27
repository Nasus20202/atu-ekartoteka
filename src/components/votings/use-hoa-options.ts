'use client';

import { useState } from 'react';
import useSWR from 'swr';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';

export const HOA_SEARCH_DEBOUNCE_MS = 200;

export interface HoaOption {
  id: string;
  name: string;
}

async function fetchHoaOptions([, search]: readonly [string, string]): Promise<
  HoaOption[]
> {
  const data = await fetchJson<{ homeownersAssociations: HoaOption[] }>(
    `/api/admin/hoa?${new URLSearchParams({ search })}`
  );
  return data.homeownersAssociations;
}

/**
 * Associations matching a typed text, searched by the database. `all` is the
 * whole list from the server, shown while nothing is typed.
 */
export function useHoaOptions(all: HoaOption[]) {
  const [search, setSearch] = useState('');
  const term = search.trim();
  const debounced = useDebouncedValue(term, HOA_SEARCH_DEBOUNCE_MS);

  const { data, error, isLoading } = useSWR(
    term && debounced ? (['voting-hoa-options', debounced] as const) : null,
    fetchHoaOptions,
    { ...SWR_OPTIONS, keepPreviousData: true }
  );

  return {
    search,
    setSearch,
    options: term ? (data ?? all) : all,
    // The options on screen do not answer the typed text yet
    pending: Boolean(term) && (term !== debounced || isLoading),
    failed: Boolean(term) && error !== undefined,
  } as const;
}
