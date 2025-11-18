import { Building2 } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { BackButton } from '@/components/back-button';
import { PeriodCard } from '@/components/charges/period-card';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { AccountStatus } from '@/lib/types';

export default async function ApartmentChargesPage({
  params,
}: {
  params: { apartmentId: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  // Fetch apartment with charges
  const apartment = await prisma.apartment.findFirst({
    where: {
      id: params.apartmentId,
      userId: session.user.id,
      isActive: true,
    },
    include: {
      charges: {
        orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
      },
    },
  });

  if (!apartment) {
    notFound();
  }

  // Group charges by period
  const chargesByPeriod = new Map<
    string,
    Array<{
      id: string;
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalAmount: number;
      dateFrom: Date;
      dateTo: Date;
    }>
  >();

  apartment.charges.forEach((charge) => {
    if (!chargesByPeriod.has(charge.period)) {
      chargesByPeriod.set(charge.period, []);
    }

    chargesByPeriod.get(charge.period)!.push({
      id: charge.id,
      description: charge.description,
      quantity: charge.quantity,
      unit: charge.unit,
      unitPrice: charge.unitPrice,
      totalAmount: charge.totalAmount,
      dateFrom: charge.dateFrom,
      dateTo: charge.dateTo,
    });
  });

  const periods = Array.from(chargesByPeriod.keys()).sort().reverse();

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar userId={session.user.id} />
      <main className="p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">
                {apartment.address} {apartment.number}
              </h1>
              <p className="text-sm text-muted-foreground">
                {apartment.postalCode} {apartment.city}
              </p>
            </div>
          </div>

          {periods.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">Brak naliczeń</p>
                  <p className="text-sm text-muted-foreground">
                    Nie znaleziono żadnych naliczeń dla tego mieszkania.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {periods.map((period) => {
                const charges = chargesByPeriod.get(period)!;
                const totalAmount = charges.reduce(
                  (sum, charge) => sum + charge.totalAmount,
                  0
                );

                return (
                  <PeriodCard
                    key={period}
                    period={period}
                    charges={charges}
                    totalAmount={totalAmount}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
