'use client';

import useSWR from 'swr';

import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';

const SETUP_CHECK_URL = '/api/setup/check';

/** Whether the app still needs its first admin account. */
export function useSetupStatus() {
  const { data, isLoading } = useSWR<{ needsSetup: boolean }>(
    SETUP_CHECK_URL,
    fetchJson,
    SWR_OPTIONS
  );

  return { isFirstAdmin: data?.needsSetup ?? false, checkingSetup: isLoading };
}
