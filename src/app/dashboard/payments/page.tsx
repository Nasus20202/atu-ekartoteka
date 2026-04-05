import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { PaymentYearRow } from '@/components/payments/payment-year-row';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus } from '@/lib/types';

export default async function PaymentsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
        include: {
          homeownersAssociation: true,
          payments: {
            orderBy: { year: 'desc' },
          },
        },
      },
    },
  });

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
            const apartmentLabel = `${apartment.address} ${apartment.building || ''}/${apartment.number}`;
            return (
              <Card key={apartment.id}>
                <CardHeader>
                  <CardTitle>
                    {apartment.address} {apartment.building || ''}/
                    {apartment.number}
                  </CardTitle>
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
                    <div className="space-y-3">
                      {apartment.payments.map(
                        (payment: (typeof apartment.payments)[number]) => (
                          <PaymentYearRow
                            key={payment.id}
                            apartmentId={apartment.id}
                            apartmentLabel={apartmentLabel}
                            hoaName={apartment.homeownersAssociation.name}
                            payment={{
                              ...payment,
                              dateFrom: payment.dateFrom.toISOString(),
                              dateTo: payment.dateTo.toISOString(),
                              createdAt: payment.createdAt.toISOString(),
                              updatedAt: payment.updatedAt.toISOString(),
                            }}
                            dateFromLabel={payment.dateFrom.toLocaleDateString(
                              'pl-PL'
                            )}
                            dateToLabel={payment.dateTo.toLocaleDateString(
                              'pl-PL'
                            )}
                          />
                        )
                      )}
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
