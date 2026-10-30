import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

import {
  getCommonChargesDataDate,
  getSortedPeriods,
  groupApartmentChargesByPeriod,
  toActivePeriod,
} from '@/app/dashboard/charges/charges-by-period';
import { auth } from '@/auth';
import { MultiChargesDisplay } from '@/components/charges/multi-charges-display';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { findUserWithApartmentChargesCached } from '@/lib/queries/users/find-user-with-apartment-charges';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { AccountStatus } from '@/lib/types';

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const startYear = await getTenantHistoryStartYear();
  const userData = await findUserWithApartmentChargesCached(
    session.user.id,
    startYear
  );

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  const chargesByPeriod = groupApartmentChargesByPeriod(userData.apartments);
  const periods = getSortedPeriods(chargesByPeriod);
  const chargesDataDate = getCommonChargesDataDate(userData.apartments);

  return (
    <Page>
      <PageHeader title="Naliczenia" />

      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-50 items-center justify-center">
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
        <MultiChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
          chargesDataDate={chargesDataDate}
          activeMonth={toActivePeriod(month)}
        />
      )}
    </Page>
  );
}
