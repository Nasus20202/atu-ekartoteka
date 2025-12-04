import { Building2 } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PeriodCard } from '@/components/charges/period-card';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus, type ChargeDisplay } from '@/lib/types';

export default async function ApartmentChargesPage({
  params,
}: {
  params: Promise<{ apartmentId: string }>;
}) {
  const { apartmentId } = await params;
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
      id: apartmentId,
      userId: session.user.id,
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
  const chargesByPeriod = new Map<string, ChargeDisplay[]>();

  apartment.charges.forEach((charge: (typeof apartment.charges)[number]) => {
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
    <Page maxWidth="4xl">
      <PageHeader
        title={`${apartment.address} ${apartment.building || ''}/${apartment.number}`}
        description={`${apartment.postalCode} ${apartment.city}`}
      />

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
    </Page>
  );
}
