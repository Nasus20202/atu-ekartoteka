import { Building2 } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PeriodCard } from '@/components/charges/period-card';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import {
  DownloadChargesPdfButton,
  type SerializableCharge,
} from '@/components/pdf/download-charges-pdf-button';
import { Card, CardContent } from '@/components/ui/card';
import { findApartmentWithChargesCached } from '@/lib/queries/apartments/find-apartment-with-charges';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';
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

  const userData = await findUserByIdCached(session.user.id);

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  // Fetch apartment with charges
  const apartment = await findApartmentWithChargesCached(
    apartmentId,
    session.user.id
  );

  if (!apartment) {
    notFound();
  }

  // Group charges by period
  const chargesByPeriod = new Map<string, ChargeDisplay[]>();
  const serializableByPeriod: Record<string, SerializableCharge[]> = {};

  apartment.charges.forEach((charge: (typeof apartment.charges)[number]) => {
    if (!chargesByPeriod.has(charge.period)) {
      chargesByPeriod.set(charge.period, []);
      serializableByPeriod[charge.period] = [];
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

    serializableByPeriod[charge.period].push({
      id: charge.id,
      description: charge.description,
      quantity: charge.quantity,
      unit: charge.unit,
      unitPrice: charge.unitPrice,
      totalAmount: charge.totalAmount,
    });
  });

  const periods = Array.from(chargesByPeriod.keys()).sort().reverse();
  const apartmentLabel = `${apartment.address} ${apartment.building || ''}/${apartment.number}`;

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
                action={
                  <DownloadChargesPdfButton
                    apartmentLabel={apartmentLabel}
                    hoaName={apartment.homeownersAssociation.name}
                    period={period}
                    charges={serializableByPeriod[period]}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </Page>
  );
}
