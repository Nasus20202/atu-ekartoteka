import { Building2 } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ChargesDisplay } from '@/components/charges/charges-display';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { findApartmentWithChargesCached } from '@/lib/queries/apartments/find-apartment-with-charges';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';
import { AccountStatus } from '@/lib/types';
import {
  type ChargeDisplayDto,
  toChargeDisplayDto,
} from '@/lib/types/dto/charge-dto';

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

  const chargesByPeriod: Record<string, ChargeDisplayDto[]> = {};

  apartment.charges.forEach((charge: (typeof apartment.charges)[number]) => {
    if (!chargesByPeriod[charge.period]) {
      chargesByPeriod[charge.period] = [];
    }

    chargesByPeriod[charge.period].push(toChargeDisplayDto(charge));
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
          <CardContent className="flex min-h-50 items-center justify-center">
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
