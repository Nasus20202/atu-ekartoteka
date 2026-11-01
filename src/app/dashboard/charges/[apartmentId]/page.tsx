import { Building2 } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import {
  getSortedPeriods,
  groupChargesByPeriod,
  toActivePeriod,
} from '@/app/dashboard/charges/charges-by-period';
import { auth } from '@/auth';
import { ChargesDisplay } from '@/components/charges/charges-display';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { isApprovedAccount } from '@/lib/auth/account-access';
import { getChargesTitle } from '@/lib/metadata/page-titles';
import { findApartmentWithChargesCached } from '@/lib/queries/apartments/find-apartment-with-charges';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ apartmentId: string }>;
}): Promise<Metadata> {
  const { apartmentId } = await params;
  return { title: await getChargesTitle(apartmentId) };
}

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

  if (!userData || !isApprovedAccount(userData)) {
    redirect('/dashboard');
  }

  const cutoffPeriod = dateToPeriod(await getRequestNow());
  const apartment = await findApartmentWithChargesCached(
    apartmentId,
    session.user.id,
    await getTenantHistoryStartYear(),
    cutoffPeriod
  );

  if (!apartment) {
    notFound();
  }

  const chargesByPeriod = groupChargesByPeriod(apartment.charges);
  const periods = getSortedPeriods(chargesByPeriod);
  const apartmentLabel = formatApartmentLabel(apartment);
  const activeMonth = toActivePeriod(month);

  return (
    <Page maxWidth="4xl">
      <PageHeader
        title={apartmentLabel}
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
