'use client';

import useSWR from 'swr';

import type { TurnstileConfig } from '@/lib/auth/types/turnstile';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';

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
