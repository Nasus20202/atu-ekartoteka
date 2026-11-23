import { notFound } from 'next/navigation';
import { cache } from 'react';

import { findApartmentWithCharges } from '@/lib/apartments/queries/find-apartment-with-charges';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { getTenantHistoryStartYear } from '@/lib/framework/tenant-history';
import { dateToPeriod } from '@/lib/shared/utils/period';

// Memoized per request: the header and the content share one query
export const loadApartmentCharges = cache(async (apartmentId: string) => {
  const { userId } = await requireApprovedTenant();
  const [startYear, now] = await Promise.all([
    getTenantHistoryStartYear(),
    getRequestNow(),
  ]);
  const apartment = await findApartmentWithCharges(
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
