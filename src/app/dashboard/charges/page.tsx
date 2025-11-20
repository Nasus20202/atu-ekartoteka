import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { MultiApartmentPeriodCard } from '@/components/charges/multi-apartment-period-card';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import type { ChargeData } from '@/lib/charge-utils';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus } from '@/lib/types';

export default async function ChargesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      apartments: {
        where: { isActive: true },
        include: {
          charges: {
            orderBy: [{ period: 'desc' }, { externalLineNo: 'asc' }],
          },
        },
      },
    },
  });

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  // Group charges by period
  const chargesByPeriod = new Map<
    string,
    Array<{
      apartmentNumber: string;
      apartmentAddress: string;
      charges: ChargeData[];
    }>
  >();

  userData.apartments.forEach((apartment) => {
    apartment.charges.forEach((charge) => {
      if (!chargesByPeriod.has(charge.period)) {
        chargesByPeriod.set(charge.period, []);
      }

      const periodData = chargesByPeriod.get(charge.period)!;
      let apartmentData = periodData.find(
        (a) => a.apartmentNumber === apartment.number
      );

      if (!apartmentData) {
        apartmentData = {
          apartmentNumber: apartment.number,
          apartmentAddress:
            `${apartment.address || ''} ${apartment.building || ''}/${apartment.number}`
              .replace(/\s+\//g, ' /')
              .trim(),
          charges: [],
        };
        periodData.push(apartmentData);
      }

      apartmentData.charges.push({
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
  });

  const periods = Array.from(chargesByPeriod.keys()).sort().reverse();

  return (
    <Page>
      <PageHeader title="Naliczenia" />

      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Brak naliczeń</p>
              <p className="text-sm text-muted-foreground">
                Nie znaleziono żadnych naliczeń dla Twoich mieszkań.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {periods.map((period) => {
            const periodData = chargesByPeriod.get(period)!;
            const totalPeriodAmount = periodData.reduce(
              (sum, apt) =>
                sum +
                apt.charges.reduce(
                  (aptSum, charge) => aptSum + charge.totalAmount,
                  0
                ),
              0
            );

            return (
              <MultiApartmentPeriodCard
                key={period}
                period={period}
                apartmentsData={periodData}
                totalAmount={totalPeriodAmount}
              />
            );
          })}
        </div>
      )}
    </Page>
  );
}
