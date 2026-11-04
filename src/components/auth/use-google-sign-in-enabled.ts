'use client';

import useSWR from 'swr';

import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';

const GOOGLE_CONFIG_URL = '/api/config/google';

interface GoogleConfig {
  enabled: boolean;
}

/** Whether Google sign-in is configured; false while loading or on failure. */
export function useGoogleSignInEnabled(): boolean {
  const { data } = useSWR<GoogleConfig>(
    GOOGLE_CONFIG_URL,
    fetchJson,
    SWR_OPTIONS
  );

  return data?.enabled ?? false;
}
