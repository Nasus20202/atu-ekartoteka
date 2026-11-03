import { notFound } from 'next/navigation';
import { cache } from 'react';

import { requireApprovedTenant } from '@/lib/auth/require-approved-tenant';
import { findApartmentWithChargesCached } from '@/lib/queries/apartments/find-apartment-with-charges';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

// Memoized per request: the header and the content share one query
export const loadApartmentCharges = cache(async (apartmentId: string) => {
  const { userId } = await requireApprovedTenant();
  const [startYear, now] = await Promise.all([
    getTenantHistoryStartYear(),
    getRequestNow(),
  ]);
  const apartment = await findApartmentWithChargesCached(
    apartmentId,
    userId,
    startYear,
    dateToPeriod(now)
  );

  if (!apartment) {
    notFound();
  }

  return apartment;
});
