import { notFound, redirect } from 'next/navigation';

import {
  getPaymentSummary,
  parsePaymentYear,
} from '@/app/dashboard/payments/[apartmentId]/[year]/payment-summary';
import { auth } from '@/auth';
import { getPaymentMonthlyChartData } from '@/components/charts/chart-data';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { PaymentApartmentDetailsCard } from '@/components/payments/payment-apartment-details-card';
import { PaymentMonthlyChartCard } from '@/components/payments/payment-monthly-chart-card';
import { PaymentTable } from '@/components/payments/payment-table';
import { PaymentYearSelect } from '@/components/payments/payment-year-select';
import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { findApartmentPaymentYearsCached } from '@/lib/queries/apartments/find-apartment-payment-years';
import { findApartmentWithPaymentsByYearCached } from '@/lib/queries/apartments/find-apartment-with-payments-by-year';
import { toPaymentPdfDto } from '@/lib/types/dto/payment-dto';
import { formatCurrency } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import {
  getBalanceStatusClass,
  getSignedBalanceClass,
} from '@/lib/utils/balance-class';
import { APP_LOCALE } from '@/lib/utils/locale';

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

  const yearNumber = parsePaymentYear(year);
  if (yearNumber === null) {
    notFound();
  }

  const [apartment, paymentYears] = await Promise.all([
    findApartmentWithPaymentsByYearCached(
      apartmentId,
      session.user.id,
      yearNumber
    ),
    findApartmentPaymentYearsCached(apartmentId, session.user.id),
  ]);

  if (!apartment || apartment.payments.length === 0) {
    notFound();
  }

  const payment = apartment.payments[0];

  const { totalPayments, totalCharges, openingBalance, closingBalance } =
    getPaymentSummary(payment);
  const monthlyChartData = getPaymentMonthlyChartData(payment);

  const apartmentLabel = formatApartmentLabel(apartment);

  const paymentPdfDto = toPaymentPdfDto(payment);

  return (
    <Page maxWidth="4xl">
      <PageHeader
        title={`Wpłaty - ${apartment.address} ${apartment.building || ''}/${apartment.number}`}
        description={`Szczegóły wpłat za rok ${payment.year}`}
        action={
          paymentYears.length > 1 && (
            <PaymentYearSelect
              apartmentId={apartment.id}
              year={payment.year}
              years={paymentYears}
            />
          )
        }
      />

      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Podsumowanie roku {payment.year}</CardTitle>
                <CardDescription>
                  Okres: {payment.dateFrom.toLocaleDateString(APP_LOCALE)} -{' '}
                  {payment.dateTo.toLocaleDateString(APP_LOCALE)}
                </CardDescription>
              </div>
              <div className="shrink-0">
                <DownloadPaymentPdfButton
                  apartmentLabel={apartmentLabel}
                  hoaName={apartment.homeownersAssociation.name}
                  payment={paymentPdfDto}
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
                  className={`text-2xl font-bold ${getSignedBalanceClass(openingBalance)}`}
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
                  className={`text-2xl font-bold ${getBalanceStatusClass(closingBalance)}`}
                >
                  {formatCurrency(closingBalance)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaymentMonthlyChartCard data={monthlyChartData} />

        {/* Monthly Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Wpłaty i naliczenia miesięczne</CardTitle>
            <CardDescription>
              Szczegółowy wykaz wpłat i naliczeń z bilansem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentTable
              payment={payment}
              apartmentId={apartment.id}
              chargesDataDate={
                apartment.homeownersAssociation.chargesDataDate?.toISOString() ??
                null
              }
            />
          </CardContent>
        </Card>

        <PaymentApartmentDetailsCard
          address={apartment.address ?? ''}
          building={apartment.building}
          number={apartment.number}
          postalCode={apartment.postalCode ?? ''}
          city={apartment.city ?? ''}
          shareNumerator={apartment.shareNumerator}
          shareDenominator={apartment.shareDenominator}
        />
      </div>
    </Page>
  );
}
