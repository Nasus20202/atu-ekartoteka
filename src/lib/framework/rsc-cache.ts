import { cache } from 'react';

import { readTenantHistoryYearsBack } from '@/lib/settings/queries/app-settings';
import { findUserById } from '@/lib/users/queries/find-user-by-id';

/**
 * Request-scoped dedupe for the two reads that several entry points render in
 * one request. Every other read is called directly: the loader that calls it is
 * already memoised, so a wrapper of its own adds nothing.
 */
export const getTenantHistoryYearsBack = cache(readTenantHistoryYearsBack);
export const findUserByIdCached = cache(findUserById);
