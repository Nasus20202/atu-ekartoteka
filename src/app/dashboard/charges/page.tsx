import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { MultiApartmentPeriodCard } from '@/components/charges/multi-apartment-period-card';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import { Card, CardContent } from '@/components/ui/card';
import { findUserWithApartmentChargesCached } from '@/lib/queries/users/find-user-with-apartment-charges';
import { AccountStatus, type ChargeDisplay } from '@/lib/types';

type ApartmentPeriodData = {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplay[];
  action?: React.ReactNode;
};

export default async function ChargesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await findUserWithApartmentChargesCached(session.user.id);

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  const chargesByPeriod = new Map<string, ApartmentPeriodData[]>();

  userData.apartments.forEach(
    (apartment: (typeof userData.apartments)[number]) => {
      const apartmentLabel =
        `${apartment.address || ''} ${apartment.building || ''}/${apartment.number}`
          .replace(/\s+\//g, ' /')
          .trim();

      apartment.charges.forEach(
        (charge: (typeof apartment.charges)[number]) => {
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
              apartmentAddress: apartmentLabel,
              hoaName: apartment.homeownersAssociation.name,
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
        }
      );
    }
  );

  // Attach PDF download buttons per apartment per period
  for (const [period, periodData] of chargesByPeriod.entries()) {
    for (const apartmentData of periodData) {
      apartmentData.action = (
        <DownloadChargesPdfButton
          apartmentLabel={apartmentData.apartmentAddress}
          hoaName={apartmentData.hoaName}
          period={period}
          charges={apartmentData.charges.map((c) => ({
            id: c.id,
            description: c.description,
            quantity: c.quantity,
            unit: c.unit,
            unitPrice: c.unitPrice,
            totalAmount: c.totalAmount,
          }))}
        />
      );
    }
  }

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
