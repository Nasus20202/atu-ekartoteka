import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { PaymentTable } from '@/components/payment-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

interface PaymentDetailsPageProps {
  params: Promise<{
    apartmentId: string;
    year: string;
  }>;
}

export default async function PaymentDetailsPage({
  params,
}: PaymentDetailsPageProps) {
  const { apartmentId, year } = await params;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Validate year parameter
  const yearNumber = parseInt(year, 10);
  if (isNaN(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
    notFound();
  }

  const apartment = await prisma.apartment.findFirst({
    where: {
      id: apartmentId,
      userId: session.user.id,
    },
    include: {
      payments: {
        where: { year: yearNumber },
      },
      charges: true,
    },
  });

  if (!apartment || apartment.payments.length === 0) {
    notFound();
  }

  const payment = apartment.payments[0];

  const totalPayments =
    payment.januaryPayments +
    payment.februaryPayments +
    payment.marchPayments +
    payment.aprilPayments +
    payment.mayPayments +
    payment.junePayments +
    payment.julyPayments +
    payment.augustPayments +
    payment.septemberPayments +
    payment.octoberPayments +
    payment.novemberPayments +
    payment.decemberPayments;

  const totalCharges =
    payment.januaryCharges +
    payment.februaryCharges +
    payment.marchCharges +
    payment.aprilCharges +
    payment.mayCharges +
    payment.juneCharges +
    payment.julyCharges +
    payment.augustCharges +
    payment.septemberCharges +
    payment.octoberCharges +
    payment.novemberCharges +
    payment.decemberCharges;

  return (
    <Page maxWidth="4xl">
      <PageHeader
        title={`Wpłaty - ${apartment.address} ${apartment.building || ''}/${apartment.number}`}
        description={`Szczegóły wpłat za rok ${payment.year}`}
      />

      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Podsumowanie roku {payment.year}</CardTitle>
            <CardDescription>
              Okres: {payment.dateFrom.toLocaleDateString('pl-PL')} -{' '}
              {payment.dateTo.toLocaleDateString('pl-PL')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">
                  Saldo początkowe
                </div>
                <div className="text-2xl font-bold">
                  {payment.openingBalance.toFixed(2)} zł
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">Naliczenia</div>
                <div className="text-2xl font-bold">
                  {totalCharges.toFixed(2)} zł
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">Suma wpłat</div>
                <div className="text-2xl font-bold">
                  {totalPayments.toFixed(2)} zł
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">
                  Saldo końcowe
                </div>
                <div
                  className={`text-2xl font-bold ${
                    payment.closingBalance >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {payment.closingBalance.toFixed(2)} zł
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Wpłaty i naliczenia miesięczne</CardTitle>
            <CardDescription>
              Szczegółowy wykaz wpłat i naliczeń z bilansem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentTable payment={payment} />
          </CardContent>
        </Card>

        {/* Apartment Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dane lokalu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Adres</div>
                <div>
                  {apartment.address} {apartment.building || ''}/
                  {apartment.number}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Miasto</div>
                <div>
                  {apartment.postalCode} {apartment.city}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">
                  Numer lokalu
                </div>
                <div>{apartment.number}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">
                  Procent udziału
                </div>
                <div>
                  {apartment.shareNumerator &&
                  apartment.shareDenominator &&
                  apartment.shareDenominator > 0
                    ? (
                        (apartment.shareNumerator /
                          apartment.shareDenominator) *
                        100
                      ).toFixed(1)
                    : '-'}
                  %
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
