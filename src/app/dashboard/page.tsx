import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { UserStatusSection } from '@/components/user-status-section';
import { sumDecimals } from '@/lib/money/sum';
import { findUserWithApartmentsCached } from '@/lib/queries/users/find-user-with-apartments';
import { AccountStatus } from '@/lib/types';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await findUserWithApartmentsCached(session.user.id);

  if (!userData) {
    redirect('/login');
  }

  // Calculate current and previous month periods
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const previousPeriod = `${prevMonth.getFullYear()}${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  // Calculate charges for current and previous month
  const currentMonthCharges = userData.apartments.flatMap(
    (apt: (typeof userData.apartments)[number]) =>
      apt.charges.filter(
        (charge: (typeof apt.charges)[number]) =>
          charge.period === currentPeriod
      )
  );
  const previousMonthCharges = userData.apartments.flatMap(
    (apt: (typeof userData.apartments)[number]) =>
      apt.charges.filter(
        (charge: (typeof apt.charges)[number]) =>
          charge.period === previousPeriod
      )
  );

  const currentMonthTotal = sumDecimals(
    currentMonthCharges.map((charge) => charge.totalAmount)
  );
  const previousMonthTotal = sumDecimals(
    previousMonthCharges.map((charge) => charge.totalAmount)
  );

  // Prepare notifications grouped by HOA for sidebar
  const allNotifications = userData.apartments.flatMap(
    (apt: (typeof userData.apartments)[number]) =>
      apt.chargeNotifications.map(
        (n: (typeof apt.chargeNotifications)[number]) => ({
          ...n,
          apartmentNumber: apt.number,
          apartmentAddress: `${apt.address} ${apt.building || ''}/${apt.number}`
            .replace(/\s+\//g, ' /')
            .trim(),
          hoaId: apt.homeownersAssociation?.id ?? null,
          hoaName: apt.homeownersAssociation?.name ?? null,
          hoaHeader: apt.homeownersAssociation?.header ?? null,
        })
      )
  );

  // Prepare per-HOA payment groups for summary card
  type HoaPaymentGroup = {
    hoaId: string;
    hoaName: string;
    totalClosingBalance: ReturnType<typeof sumDecimals>;
  };
  const hoaPaymentMap = new Map<string, HoaPaymentGroup>();

  for (const apt of userData.apartments) {
    if (apt.payments.length === 0) continue;
    const hoa = apt.homeownersAssociation;
    if (!hoa?.id) continue;
    const existing = hoaPaymentMap.get(hoa.id);
    const balance = apt.payments[0].closingBalance;
    if (existing) {
      existing.totalClosingBalance = existing.totalClosingBalance.plus(balance);
    } else {
      hoaPaymentMap.set(hoa.id, {
        hoaId: hoa.id,
        hoaName: hoa.name,
        totalClosingBalance: balance,
      });
    }
  }
  const hoaPaymentGroups = Array.from(hoaPaymentMap.values());

  return (
    <div className="w-full bg-background">
      <main className="p-4 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold animate-fade-in">
            Witaj{userData.name ? `, ${userData.name}` : ''}!
          </h1>

          <div
            className={`grid gap-6 ${allNotifications.length > 0 && userData.status === AccountStatus.APPROVED ? 'lg:grid-cols-[1fr_350px] lg:items-start' : ''}`}
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
                hoaPaymentGroups.length > 0 && (
                  <PaymentsSummaryCard hoaGroups={hoaPaymentGroups} />
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
