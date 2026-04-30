import { Building2 } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ChargesDisplay } from '@/components/charges/charges-display';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  type SerializableChargeDisplay,
  serializeCharge,
} from '@/lib/charges/serialize-charge';
import { findApartmentWithChargesCached } from '@/lib/queries/apartments/find-apartment-with-charges';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';
import { AccountStatus } from '@/lib/types';

export default async function ApartmentChargesPage({
  params,
  searchParams,
}: {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { apartmentId } = await params;
  const { month } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await findUserByIdCached(session.user.id);

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  const apartment = await findApartmentWithChargesCached(
    apartmentId,
    session.user.id
  );

  if (!apartment) {
    notFound();
  }

  const chargesByPeriod: Record<string, SerializableChargeDisplay[]> = {};

  apartment.charges.forEach((charge: (typeof apartment.charges)[number]) => {
    if (!chargesByPeriod[charge.period]) {
      chargesByPeriod[charge.period] = [];
    }

    chargesByPeriod[charge.period].push({
      ...serializeCharge({
        id: charge.id,
        description: charge.description,
        quantity: charge.quantity,
        unit: charge.unit,
        unitPrice: charge.unitPrice,
        totalAmount: charge.totalAmount,
        dateFrom: charge.dateFrom,
        dateTo: charge.dateTo,
      }),
    });
  });

  const periods = Object.keys(chargesByPeriod).sort().reverse();
  const apartmentLabel = `${apartment.address} ${apartment.building || ''}/${apartment.number}`;
  // URL param is YYYY-MM, DB periods are YYYYMM — normalise by stripping the dash
  const activeMonth = month ? month.replace('-', '') : null;

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
        <ChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
          activeMonth={activeMonth}
          apartmentLabel={apartmentLabel}
          hoaName={apartment.homeownersAssociation.name}
        />
      )}
    </Page>
  );
}
