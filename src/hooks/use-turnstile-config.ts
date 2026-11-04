'use client';

import useSWR from 'swr';

import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';
import type { TurnstileConfig } from '@/lib/types/turnstile';

const TURNSTILE_CONFIG_URL = '/api/config/turnstile';
const DISABLED_TURNSTILE: TurnstileConfig = { siteKey: null, enabled: false };

/** Loads the Turnstile config; null while loading, disabled on failure. */
export function useTurnstileConfig(): TurnstileConfig | null {
  const { data, error } = useSWR<TurnstileConfig>(
    TURNSTILE_CONFIG_URL,
    fetchJson,
    { ...SWR_OPTIONS, revalidateIfStale: false }
  );

  return data ?? (error ? DISABLED_TURNSTILE : null);
}
