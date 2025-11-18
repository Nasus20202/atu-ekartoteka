import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import { UserStatusSection } from '@/components/user-status-section';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch user with apartments and charges
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          charges: {
            orderBy: { period: 'desc' },
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

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <DashboardNavbar userId={session.user.id} />

      <main className="p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">
            Witaj{userData.name ? `, ${userData.name}` : ''}!
          </h1>

          <div className="space-y-6">
            {/* Account Status Card */}
            <UserStatusSection
              name={userData.name}
              email={userData.email}
              status={userData.status}
            />

            {/* Charges Card */}
            {userData.status === 'APPROVED' &&
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
            {userData.status === 'APPROVED' && (
              <ApartmentsSection apartments={userData.apartments} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
