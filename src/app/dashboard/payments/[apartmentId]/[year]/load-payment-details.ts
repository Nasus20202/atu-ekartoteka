import { notFound } from 'next/navigation';
import { cache } from 'react';

import { parsePaymentYear } from '@/app/dashboard/payments/[apartmentId]/[year]/payment-summary';
import { findApartmentPaymentYears } from '@/lib/apartments/queries/find-apartment-payment-years';
import { findApartmentWithPaymentsByYear } from '@/lib/apartments/queries/find-apartment-with-payments-by-year';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { getTenantHistoryStartYear } from '@/lib/framework/tenant-history';
import { dateToPeriod } from '@/lib/shared/utils/period';

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
      findApartmentWithPaymentsByYear(
        apartmentId,
        userId,
        yearNumber,
        startYear,
        cutoffPeriod
      ),
      findApartmentPaymentYears(apartmentId, userId, startYear),
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
