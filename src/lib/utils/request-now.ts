import { headers } from 'next/headers';

import { FIXED_NOW_ENV_FLAG, FIXED_NOW_HEADER } from '@/lib/utils/fixed-now';

/**
 * Current date for a request. E2E environments may freeze it with a header,
 * so date-dependent pages render deterministically in visual tests.
 */
export async function getRequestNow(): Promise<Date> {
  if (process.env[FIXED_NOW_ENV_FLAG] === 'true') {
    const value = (await headers()).get(FIXED_NOW_HEADER);
    const fixed = value ? new Date(value) : null;

    if (fixed && !Number.isNaN(fixed.getTime())) {
      return fixed;
    }
  }

  return new Date();
}
