import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

import {
  getSortedPeriods,
  groupApartmentChargesByPeriod,
  toActivePeriod,
} from '@/app/dashboard/charges/charges-by-period';
import { MultiChargesDisplay } from '@/components/charges/multi-charges-display';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { isApprovedAccount } from '@/lib/auth/account-access';
import { getSession } from '@/lib/auth/get-session';
import { findUserWithApartmentChargesCached } from '@/lib/queries/users/find-user-with-apartment-charges';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

interface ChargesOverviewProps {
  searchParams: Promise<{ month?: string }>;
}

export async function ChargesOverview({ searchParams }: ChargesOverviewProps) {
  const [{ month }, session] = await Promise.all([searchParams, getSession()]);

  if (!session) {
    redirect('/login');
  }

  const startYear = await getTenantHistoryStartYear();
  const cutoffPeriod = dateToPeriod(await getRequestNow());
  const userData = await findUserWithApartmentChargesCached(
    session.user.id,
    startYear,
    cutoffPeriod
  );

  if (!userData || !isApprovedAccount(userData)) {
    redirect('/dashboard');
  }

  const chargesByPeriod = groupApartmentChargesByPeriod(userData.apartments);
  const periods = getSortedPeriods(chargesByPeriod);

  return (
    <div className={REVEAL_CLASS}>
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
          activeMonth={toActivePeriod(month)}
        />
      )}
    </div>
  );
}
