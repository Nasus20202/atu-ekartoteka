import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { PaymentTable } from '@/components/payment-table';
import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toDecimal } from '@/lib/money/decimal';
import { sumDecimals } from '@/lib/money/sum';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/payments/empty-months';
import {
  type SerializablePayment,
  serializePayment,
} from '@/lib/payments/serialize-payment';
import { findApartmentWithPaymentsByYearCached } from '@/lib/queries/apartments/find-apartment-with-payments-by-year';
import { formatCurrency } from '@/lib/utils';

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

  const apartment = await findApartmentWithPaymentsByYearCached(
    apartmentId,
    session.user.id,
    yearNumber
  );

  if (!apartment || apartment.payments.length === 0) {
    notFound();
  }

  const payment = apartment.payments[0];

  const totalPayments = sumDecimals(
    PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const totalCharges = sumDecimals(
    CHARGE_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const openingBalance = toDecimal(payment.openingBalance);
  const closingBalance = toDecimal(payment.closingBalance);

  const apartmentLabel = `${apartment.address} ${apartment.building || ''}/${apartment.number}`;

  const serializablePayment: SerializablePayment = serializePayment(payment);

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Podsumowanie roku {payment.year}</CardTitle>
                <CardDescription>
                  Okres: {payment.dateFrom.toLocaleDateString('pl-PL')} -{' '}
                  {payment.dateTo.toLocaleDateString('pl-PL')}
                </CardDescription>
              </div>
              <div className="shrink-0">
                <DownloadPaymentPdfButton
                  apartmentLabel={apartmentLabel}
                  hoaName={apartment.homeownersAssociation.name}
                  payment={serializablePayment}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">
                  Saldo początkowe
                </div>
                <div
                  className={`text-2xl font-bold ${
                    openingBalance.isNegative()
                      ? 'text-red-600'
                      : openingBalance.greaterThan(0)
                        ? 'text-green-600'
                        : ''
                  }`}
                >
                  {formatCurrency(openingBalance)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">Naliczenia</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalCharges)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">Suma wpłat</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalPayments)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground">
                  Saldo końcowe
                </div>
                <div
                  className={`text-2xl font-bold ${
                    closingBalance.greaterThanOrEqualTo(0)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(closingBalance)}
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
            <PaymentTable payment={payment} apartmentId={apartment.id} />
          </CardContent>
        </Card>

        {/* Apartment Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dane lokalu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
