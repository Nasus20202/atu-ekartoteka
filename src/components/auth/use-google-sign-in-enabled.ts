'use client';

import useSWR from 'swr';

import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';

const GOOGLE_CONFIG_URL = '/api/config/google';

interface GoogleConfig {
  enabled: boolean;
}

/**
 * Whether Google sign-in is configured; null while loading and false on
 * failure, so callers can reserve the OAuth slot until the answer is known.
 */
export function useGoogleSignInEnabled(): boolean | null {
  const { data, error } = useSWR<GoogleConfig>(
    GOOGLE_CONFIG_URL,
    fetchJson,
    SWR_OPTIONS
  );

  if (data) return data.enabled;
  return error ? false : null;
}
