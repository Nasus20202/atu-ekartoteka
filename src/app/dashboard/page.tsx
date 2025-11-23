import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { UserStatusSection } from '@/components/user-status-section';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus } from '@/lib/types';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch user with apartments, charges, notifications, and payments
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          charges: {
            orderBy: { period: 'desc' },
          },
          chargeNotifications: {
            orderBy: { lineNo: 'asc' },
          },
          payments: {
            orderBy: { year: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

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

  const currentMonthTotal = currentMonthCharges.reduce(
    (sum: number, charge: (typeof currentMonthCharges)[number]) =>
      sum + charge.totalAmount,
    0
  );
  const previousMonthTotal = previousMonthCharges.reduce(
    (sum: number, charge: (typeof previousMonthCharges)[number]) =>
      sum + charge.totalAmount,
    0
  );

  // Prepare notifications with apartment details for sidebar
  const allNotifications = userData.apartments.flatMap(
    (apt: (typeof userData.apartments)[number]) =>
      apt.chargeNotifications.map(
        (n: (typeof apt.chargeNotifications)[number]) => ({
          ...n,
          apartmentNumber: apt.number,
          apartmentAddress: `${apt.address} ${apt.building || ''}/${apt.number}`
            .replace(/\s+\//g, ' /')
            .trim(),
        })
      )
  );

  // Prepare payments with apartment details
  const latestPayments = userData.apartments
    .filter(
      (apt: (typeof userData.apartments)[number]) => apt.payments.length > 0
    )
    .map((apt: (typeof userData.apartments)[number]) => ({
      ...apt.payments[0],
      apartmentNumber: apt.number,
      apartmentAddress: `${apt.address} ${apt.building || ''}/${apt.number}`
        .replace(/\s+\//g, ' /')
        .trim(),
    }));

  return (
    <div className="bg-background animate-fade-in">
      <main className="p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold">
            Witaj{userData.name ? `, ${userData.name}` : ''}!
          </h1>

          <div
            className={`grid gap-6 ${allNotifications.length > 0 && userData.status === AccountStatus.APPROVED ? 'lg:grid-cols-[1fr_350px]' : ''}`}
          >
            {/* Sidebar - shows first on mobile, second on desktop */}
            {userData.status === AccountStatus.APPROVED &&
              allNotifications.length > 0 && (
                <aside className="lg:order-2">
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
                latestPayments.length > 0 && (
                  <PaymentsSummaryCard payments={latestPayments} />
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
