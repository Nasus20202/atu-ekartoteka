import { redirect } from 'next/navigation';
import { cache } from 'react';

import {
  getDashboardPeriods,
  withMonthlyCharges,
} from '@/app/dashboard/dashboard-data';
import { findChargeTotalsByPeriod } from '@/lib/charges/queries/find-charge-totals-by-period';
import { getSession } from '@/lib/framework/auth/get-session';
import { getRequestNow } from '@/lib/framework/request-now';
import { findUserByIdCached } from '@/lib/framework/rsc-cache';
import { getTenantHistoryStartYear } from '@/lib/framework/tenant-history';
import { findMonthlyChargeSums } from '@/lib/payments/queries/find-monthly-charge-sums';
import { dateToPeriod, yearStartPeriod } from '@/lib/shared/utils/period';
import { findUserWithApartments } from '@/lib/users/queries/find-user-with-apartments';

// Every section awaits only what it renders. Loaders are memoized per request,
// so sections that share data share one query and independent ones run in parallel.

export const loadDashboardContext = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const [startYear, now] = await Promise.all([
    getTenantHistoryStartYear(),
    getRequestNow(),
  ]);

  return {
    userId: session.user.id,
    startYear,
    now,
    ...getDashboardPeriods(now),
  };
});

export const loadAccountUser = cache(async () => {
  const { userId } = await loadDashboardContext();

  return findUserByIdCached(userId);
});

export const loadDashboardUser = cache(async () => {
  const { userId, startYear, now } = await loadDashboardContext();

  return findUserWithApartments(userId, startYear, dateToPeriod(now));
});

export const loadPeriodTotals = cache(async () => {
  const { userId, startYear, currentPeriod, previousPeriod } =
    await loadDashboardContext();

  return findChargeTotalsByPeriod(userId, startYear, [
    currentPeriod,
    previousPeriod,
  ]);
});

export const loadApartmentsWithCharges = cache(async () => {
  const [{ startYear }, user] = await Promise.all([
    loadDashboardContext(),
    loadDashboardUser(),
  ]);

  if (!user) {
    return [];
  }

  const monthlyCharges = await findMonthlyChargeSums(
    user.apartments.map((apartment) => apartment.id),
    { fromPeriod: yearStartPeriod(startYear) }
  );

  return withMonthlyCharges(user.apartments, monthlyCharges);
});
