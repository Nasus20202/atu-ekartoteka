import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { BackButton } from '@/components/back-button';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
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
    <div className="min-h-screen bg-background">
      <DashboardNavbar userId={session.user.id} />

      <main className="p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Wpłaty</h1>
              <p className="text-muted-foreground">
                Historia wpłat dla wszystkich lokali
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {userData.apartments.map((apartment) => (
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
                      {apartment.payments.map((payment) => (
                        <Link
                          key={payment.id}
                          href={`/dashboard/payments/${apartment.id}/${payment.year}`}
                          className="block"
                        >
                          <div className="rounded-lg border p-4 transition-colors hover:bg-muted">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  Rok {payment.year}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {payment.dateFrom.toLocaleDateString('pl-PL')}{' '}
                                  - {payment.dateTo.toLocaleDateString('pl-PL')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-xl font-bold ${
                                    payment.closingBalance >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {payment.closingBalance.toFixed(2)} zł
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Saldo końcowe
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
