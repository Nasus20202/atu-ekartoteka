import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
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
    },
  });

  if (!apartment || apartment.payments.length === 0) {
    notFound();
  }

  const payment = apartment.payments[0];

  const months = [
    { name: 'Styczeń', value: payment.january },
    { name: 'Luty', value: payment.february },
    { name: 'Marzec', value: payment.march },
    { name: 'Kwiecień', value: payment.april },
    { name: 'Maj', value: payment.may },
    { name: 'Czerwiec', value: payment.june },
    { name: 'Lipiec', value: payment.july },
    { name: 'Sierpień', value: payment.august },
    { name: 'Wrzesień', value: payment.september },
    { name: 'Październik', value: payment.october },
    { name: 'Listopad', value: payment.november },
    { name: 'Grudzień', value: payment.december },
  ];

  const totalPayments = months.reduce((sum, month) => sum + month.value, 0);

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
                  {payment.totalCharges.toFixed(2)} zł
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

        {/* Monthly Payments Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wpłaty miesięczne</CardTitle>
            <CardDescription>Szczegółowy wykaz wpłat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {months.map((month) => (
                <div
                  key={month.name}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    month.value > 0 ? 'bg-muted' : 'opacity-50'
                  }`}
                >
                  <div className="font-medium">{month.name}</div>
                  <div className="text-lg font-semibold">
                    {month.value.toFixed(2)} zł
                  </div>
                </div>
              ))}
            </div>
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
