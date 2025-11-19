import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { UserStatusSection } from '@/components/user-status-section';
import { AccountStatus } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

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
  const currentMonthCharges = userData.apartments.flatMap((apt) =>
    apt.charges.filter((charge) => charge.period === currentPeriod)
  );
  const previousMonthCharges = userData.apartments.flatMap((apt) =>
    apt.charges.filter((charge) => charge.period === previousPeriod)
  );

  const currentMonthTotal = currentMonthCharges.reduce(
    (sum, charge) => sum + charge.totalAmount,
    0
  );
  const previousMonthTotal = previousMonthCharges.reduce(
    (sum, charge) => sum + charge.totalAmount,
    0
  );

  // Prepare notifications with apartment details for sidebar
  const allNotifications = userData.apartments.flatMap((apt) =>
    apt.chargeNotifications.map((n) => ({
      ...n,
      apartmentNumber: apt.number,
      apartmentAddress: `${apt.address} ${apt.building || ''}/${apt.number}`
        .replace(/\s+\//g, ' /')
        .trim(),
    }))
  );

  // Prepare payments with apartment details
  const latestPayments = userData.apartments
    .filter((apt) => apt.payments.length > 0)
    .map((apt) => ({
      ...apt.payments[0],
      apartmentNumber: apt.number,
      apartmentAddress: `${apt.address} ${apt.building || ''}/${apt.number}`
        .replace(/\s+\//g, ' /')
        .trim(),
    }));

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <main className="p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold">
            Witaj{userData.name ? `, ${userData.name}` : ''}!
          </h1>

          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            {/* Main Content */}
            <div className="space-y-6">
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

            {/* Sidebar */}
            {userData.status === AccountStatus.APPROVED &&
              allNotifications.length > 0 && (
                <aside>
                  <NotificationsSidebar notifications={allNotifications} />
                </aside>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
