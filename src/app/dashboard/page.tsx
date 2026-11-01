import { redirect } from 'next/navigation';

import {
  buildApartmentBalances,
  buildDashboardNotifications,
  getChargesForPeriod,
  getDashboardPeriods,
} from '@/app/dashboard/dashboard-data';
import { auth } from '@/auth';
import { UserStatusSection } from '@/components/account/user-status-section';
import { getChargeTrendByApartment } from '@/components/charts/chart-data';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { findUserWithApartmentsCached } from '@/lib/queries/users/find-user-with-apartments';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { AccountStatus } from '@/lib/types';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';
import { sumDecimals } from '@/lib/utils/sum';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const startYear = await getTenantHistoryStartYear();
  const now = await getRequestNow();
  const userData = await findUserWithApartmentsCached(
    session.user.id,
    startYear,
    dateToPeriod(now)
  );

  if (!userData) {
    redirect('/login');
  }

  const { currentPeriod, previousPeriod } = getDashboardPeriods(now);

  const currentMonthCharges = getChargesForPeriod(
    userData.apartments,
    currentPeriod
  );
  const previousMonthCharges = getChargesForPeriod(
    userData.apartments,
    previousPeriod
  );

  const currentMonthTotal = sumDecimals(
    currentMonthCharges.map((charge) => charge.totalAmount)
  );
  const previousMonthTotal = sumDecimals(
    previousMonthCharges.map((charge) => charge.totalAmount)
  );
  const recentChargeTrend = getChargeTrendByApartment(
    userData.apartments,
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
            className={`grid grid-cols-1 gap-6 ${allNotifications.length > 0 && userData.status === AccountStatus.APPROVED ? 'lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start' : ''}`}
          >
            {/* Sidebar - shows first on mobile, second on desktop */}
            {userData.status === AccountStatus.APPROVED &&
              allNotifications.length > 0 && (
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
              {userData.status === AccountStatus.APPROVED &&
                apartmentBalances.length > 0 && (
                  <PaymentsSummaryCard apartmentBalances={apartmentBalances} />
                )}

              {/* Charges Card */}
              {userData.status === AccountStatus.APPROVED &&
                userData.apartments.length > 0 && (
                  <ChargesSummaryCard
                    currentPeriod={currentPeriod}
                    previousPeriod={previousPeriod}
                    currentMonthCharges={currentMonthCharges}
                    previousMonthCharges={previousMonthCharges}
                    currentMonthTotal={currentMonthTotal}
                    previousMonthTotal={previousMonthTotal}
                    trendData={recentChargeTrend.data}
                    trendSeries={recentChargeTrend.series}
                  />
                )}

              {/* Apartments Card */}
              {userData.status === AccountStatus.APPROVED && (
                <ApartmentsSection apartments={userData.apartments} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
