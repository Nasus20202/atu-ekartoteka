import { redirect } from 'next/navigation';

import {
  buildApartmentBalances,
  buildDashboardNotifications,
  getDashboardPeriods,
  getPeriodTotal,
  withMonthlyCharges,
} from '@/app/dashboard/dashboard-data';
import { auth } from '@/auth';
import { UserStatusSection } from '@/components/account/user-status-section';
import { getChargeTrendByApartment } from '@/components/charts/chart-data';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { isApprovedAccount } from '@/lib/auth/account-access';
import { findChargeTotalsByPeriod } from '@/lib/queries/charges/find-charge-totals-by-period';
import { findMonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import { findUserWithApartmentsCached } from '@/lib/queries/users/find-user-with-apartments';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { dateToPeriod, yearStartPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const startYear = await getTenantHistoryStartYear();
  const now = await getRequestNow();
  const { currentPeriod, previousPeriod } = getDashboardPeriods(now);
  const [userData, periodTotals] = await Promise.all([
    findUserWithApartmentsCached(session.user.id, startYear, dateToPeriod(now)),
    findChargeTotalsByPeriod(session.user.id, startYear, [
      currentPeriod,
      previousPeriod,
    ]),
  ]);

  if (!userData) {
    redirect('/login');
  }

  const currentMonth = getPeriodTotal(periodTotals, currentPeriod);
  const previousMonth = getPeriodTotal(periodTotals, previousPeriod);
  const monthlyCharges = await findMonthlyChargeSums(
    userData.apartments.map((apartment) => apartment.id),
    { fromPeriod: yearStartPeriod(startYear) }
  );
  const apartments = withMonthlyCharges(userData.apartments, monthlyCharges);
  const recentChargeTrend = getChargeTrendByApartment(
    apartments,
    currentPeriod
  );

  const allNotifications = buildDashboardNotifications(userData.apartments);
  const apartmentBalances = buildApartmentBalances(
    userData.apartments,
    currentPeriod
  );

  return (
    <div className="w-full bg-background">
      <main className="p-4 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold animate-fade-in">
            Witaj{userData.name ? `, ${userData.name}` : ''}!
          </h1>

          <div
            className={`grid grid-cols-1 gap-6 ${allNotifications.length > 0 && isApprovedAccount(userData) ? 'lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start' : ''}`}
          >
            {/* Sidebar - shows first on mobile, second on desktop */}
            {isApprovedAccount(userData) && allNotifications.length > 0 && (
              <aside className="lg:order-2 lg:self-start lg:sticky lg:top-20">
                <NotificationsSidebar notifications={allNotifications} />
              </aside>
            )}

            {/* Main Content - shows second on mobile, first on desktop */}
            <div className="space-y-6 lg:order-1">
              {/* Account Status Card */}
              <UserStatusSection
                name={userData.name}
                email={userData.email}
                status={userData.status}
              />

              {/* Payments Summary */}
              {isApprovedAccount(userData) && apartmentBalances.length > 0 && (
                <PaymentsSummaryCard apartmentBalances={apartmentBalances} />
              )}

              {/* Charges Card */}
              {isApprovedAccount(userData) &&
                userData.apartments.length > 0 && (
                  <ChargesSummaryCard
                    currentPeriod={currentPeriod}
                    previousPeriod={previousPeriod}
                    currentMonthCount={currentMonth.count}
                    previousMonthCount={previousMonth.count}
                    currentMonthTotal={currentMonth.total}
                    previousMonthTotal={previousMonth.total}
                    trendData={recentChargeTrend.data}
                    trendSeries={recentChargeTrend.series}
                  />
                )}

              {/* Apartments Card */}
              {isApprovedAccount(userData) && (
                <ApartmentsSection apartments={apartments} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
