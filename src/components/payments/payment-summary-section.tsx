import { loadPaymentDetails } from '@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details';
import { getPaymentSummary } from '@/app/dashboard/payments/[apartmentId]/[year]/payment-summary';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import type { PaymentDetailsParams } from '@/components/payments/payment-details-params';
import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toPaymentPdfDto } from '@/lib/types/dto/payment-dto';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import {
  getBalanceStatusClass,
  getSignedBalanceClass,
} from '@/lib/utils/balance-class';

export async function PaymentSummarySection({ params }: PaymentDetailsParams) {
  const { apartmentId, year } = await params;
  const { apartment, payment } = await loadPaymentDetails(apartmentId, year);
  const { totalPayments, totalCharges, openingBalance, closingBalance } =
    getPaymentSummary(payment);

  return (
    <Card className={REVEAL_CLASS}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Podsumowanie roku {payment.year}</CardTitle>
            <CardDescription>
              Okres: {formatDate(payment.dateFrom)} -{' '}
              {formatDate(payment.dateTo)}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <DownloadPaymentPdfButton
              apartmentLabel={formatApartmentLabel(apartment)}
              hoaName={apartment.homeownersAssociation.name}
              payment={toPaymentPdfDto(payment)}
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
            <div className="text-sm text-muted-foreground">Saldo końcowe</div>
            <div
              className={`text-2xl font-bold ${getBalanceStatusClass(closingBalance)}`}
            >
              {formatCurrency(closingBalance)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
