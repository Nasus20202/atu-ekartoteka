import { notFound } from 'next/navigation';
import { cache } from 'react';

import { parsePaymentYear } from '@/app/dashboard/payments/[apartmentId]/[year]/payment-summary';
import { requireApprovedTenant } from '@/lib/auth/require-approved-tenant';
import { findApartmentPaymentYearsCached } from '@/lib/queries/apartments/find-apartment-payment-years';
import { findApartmentWithPaymentsByYearCached } from '@/lib/queries/apartments/find-apartment-with-payments-by-year';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

// Memoized per request: every section of the page shares one set of queries
export const loadPaymentDetails = cache(
  async (apartmentId: string, year: string) => {
    const { userId } = await requireApprovedTenant();
    const yearNumber = parsePaymentYear(year);

    if (yearNumber === null) {
      notFound();
    }

    const [startYear, now] = await Promise.all([
      getTenantHistoryStartYear(),
      getRequestNow(),
    ]);
    const cutoffPeriod = dateToPeriod(now);
    const [apartment, paymentYears] = await Promise.all([
      findApartmentWithPaymentsByYearCached(
        apartmentId,
        userId,
        yearNumber,
        startYear,
        cutoffPeriod
      ),
      findApartmentPaymentYearsCached(apartmentId, userId, startYear),
    ]);

    if (!apartment || apartment.payments.length === 0) {
      notFound();
    }

    return {
      apartment,
      payment: apartment.payments[0],
      paymentYears,
      cutoffPeriod,
    };
  }
);
