'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { getPaymentMonthlyChartData } from '@/components/charts/chart-data';
import { PaymentMonthlyBalanceChart } from '@/components/charts/payment-monthly-balance-chart';
import { PaymentTable } from '@/components/payments/payment-table';
import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  type PaymentDtoSource,
  toPaymentPdfDto,
} from '@/lib/types/dto/payment-dto';
import { formatCurrency } from '@/lib/utils';
import { toDecimal } from '@/lib/utils/decimal';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

type PaymentMonthKey = (typeof PAYMENT_MONTH_FIELD_KEYS)[number];
type ChargeMonthKey = (typeof CHARGE_MONTH_FIELD_KEYS)[number];

interface AdminPaymentsListProps {
  payments: PaymentDtoSource[];
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
}

function sumMonths(
  payment: PaymentDtoSource,
  keys: readonly PaymentMonthKey[]
): ReturnType<typeof toDecimal>;
function sumMonths(
  payment: PaymentDtoSource,
  keys: readonly ChargeMonthKey[]
): ReturnType<typeof toDecimal>;
function sumMonths(
  payment: PaymentDtoSource,
  keys: readonly (PaymentMonthKey | ChargeMonthKey)[]
) {
  return sumDecimals(keys.map((key) => payment[key]));
}

function PaymentYearSection({
  payment,
  apartmentId,
  apartmentLabel,
  hoaName,
  defaultOpen,
}: {
  payment: PaymentDtoSource;
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const openingBalance = toDecimal(payment.openingBalance);
  const closingBalance = toDecimal(payment.closingBalance);
  const totalPayments = sumMonths(payment, PAYMENT_MONTH_FIELD_KEYS);
  const totalCharges = sumMonths(payment, CHARGE_MONTH_FIELD_KEYS);
  const monthlyChartData = getPaymentMonthlyChartData(payment);
  const paymentPdfDto = toPaymentPdfDto(payment);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex flex-1 items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
          <div className="flex items-center gap-4">
            <span>Rok {payment.year}</span>
            <span
              className={`text-base font-bold ${closingBalance.greaterThanOrEqualTo(0) ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(closingBalance)}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <DownloadPaymentPdfButton
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          payment={paymentPdfDto}
        />
      </div>
      <CollapsibleContent>
        <div className="mt-2 space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="font-medium">Saldo początkowe:</div>
            <div
              className={`text-right ${openingBalance.isNegative() ? 'text-red-600' : openingBalance.greaterThan(0) ? 'text-green-600' : ''}`}
            >
              {formatCurrency(openingBalance)}
            </div>
            <div className="font-medium">Naliczenie:</div>
            <div className="text-right">{formatCurrency(totalCharges)}</div>
            <div className="font-medium">Suma wpłat:</div>
            <div className="text-right">{formatCurrency(totalPayments)}</div>
            <div className="border-t pt-2 font-bold">Saldo końcowe:</div>
            <div
              className={`border-t pt-2 text-right font-bold ${closingBalance.isNegative() ? 'text-red-600' : closingBalance.greaterThan(0) ? 'text-green-600' : ''}`}
            >
              {formatCurrency(closingBalance)}
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-semibold">
              Wykres rozliczeń miesięcznych
            </p>
            <PaymentMonthlyBalanceChart data={monthlyChartData} />
          </div>
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-semibold">
              Wpłaty / Naliczenia miesięczne
            </p>
            <PaymentTable
              payment={payment}
              apartmentId={apartmentId}
              disableLinks
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AdminPaymentsList({
  payments,
  apartmentId,
  apartmentLabel,
  hoaName,
}: AdminPaymentsListProps) {
  const currentYear = new Date().getFullYear();
  const sorted = [...payments].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-2">
      {sorted.map((payment) => (
        <PaymentYearSection
          key={payment.id}
          payment={payment}
          apartmentId={apartmentId}
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          defaultOpen={payment.year === currentYear}
        />
      ))}
    </div>
  );
}
