import { redirect } from 'next/navigation';

import { toPaymentYearEntries } from '@/app/dashboard/payments/payment-year-entries';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { PaymentYearRow } from '@/components/payments/payment-year-row';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { isApprovedAccount } from '@/lib/auth/account-access';
import { getSession } from '@/lib/framework/auth/get-session';
import { getRequestNow } from '@/lib/framework/request-now';
import { getTenantHistoryStartYear } from '@/lib/framework/tenant-history';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import { dateToPeriod } from '@/lib/shared/utils/period';
import { findUserWithApartmentPayments } from '@/lib/users/queries/find-user-with-apartment-payments';

export async function PaymentsOverview() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const startYear = await getTenantHistoryStartYear();
  const userData = await findUserWithApartmentPayments(
    session.user.id,
    startYear,
    dateToPeriod(await getRequestNow())
  );

  if (!userData || !isApprovedAccount(userData)) {
    redirect('/dashboard');
  }

  return (
    <div className={`space-y-6 ${REVEAL_CLASS}`}>
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
  );
}
