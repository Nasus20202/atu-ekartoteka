import { redirect } from 'next/navigation';

import { toPaymentYearEntries } from '@/app/dashboard/payments/payment-year-entries';
import { auth } from '@/auth';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { PaymentYearRow } from '@/components/payments/payment-year-row';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { findUserWithApartmentPaymentsCached } from '@/lib/queries/users/find-user-with-apartment-payments';
import { getTenantHistoryStartYear } from '@/lib/settings/tenant-history';
import { AccountStatus } from '@/lib/types';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

export default async function PaymentsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const startYear = await getTenantHistoryStartYear();
  const userData = await findUserWithApartmentPaymentsCached(
    session.user.id,
    startYear,
    dateToPeriod(await getRequestNow())
  );

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  return (
    <Page>
      <PageHeader
        title="Wpłaty"
        description="Historia wpłat dla wszystkich lokali"
      />

      <div className="space-y-6">
        {userData.apartments.map(
          (apartment: (typeof userData.apartments)[number]) => {
            const entries = toPaymentYearEntries(apartment);
            return (
              <Card key={apartment.id}>
                <CardHeader>
                  <CardTitle>{formatApartmentLabel(apartment)}</CardTitle>
                  <CardDescription>
                    {apartment.postalCode} {apartment.city}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {apartment.payments.length === 0 ? (
                    <p className="text-muted-foreground">
                      Brak danych o wpłatach
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <PaymentYearRow
                          key={entry.payment.id}
                          apartmentId={entry.apartmentId}
                          apartmentLabel={entry.apartmentLabel}
                          hoaName={entry.hoaName}
                          payment={entry.payment}
                          dateFromLabel={entry.dateFromLabel}
                          dateToLabel={entry.dateToLabel}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    </Page>
  );
}
