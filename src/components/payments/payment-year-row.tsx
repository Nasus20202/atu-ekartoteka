'use client';

import Link from 'next/link';

import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import type { PaymentListItemDto } from '@/lib/types/dto/payment-dto';
import { cn, formatCurrency } from '@/lib/utils';
import { getBalanceStatusClass } from '@/lib/utils/balance-class';
import { getPaymentYearHref } from '@/lib/utils/dashboard-links';

type PaymentYearRowProps = {
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
  payment: PaymentListItemDto;
  dateFromLabel: string;
  dateToLabel: string;
};

export function PaymentYearRow({
  apartmentId,
  apartmentLabel,
  hoaName,
  payment,
  dateFromLabel,
  dateToLabel,
}: PaymentYearRowProps) {
  return (
    <Link
      href={getPaymentYearHref(apartmentId, payment.year)}
      className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium">Rok {payment.year}</div>
        <div className="text-sm text-muted-foreground">
          {dateFromLabel} - {dateToLabel}
        </div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            'text-xl font-bold tabular-nums',
            getBalanceStatusClass(payment.calculatedClosingBalance)
          )}
        >
          {formatCurrency(payment.calculatedClosingBalance)}
        </div>
        <div className="text-sm text-muted-foreground">Saldo końcowe</div>
      </div>
      <div onClick={(e) => e.preventDefault()} className="shrink-0">
        <DownloadPaymentPdfButton
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          payment={payment}
          compact
        />
      </div>
    </Link>
  );
}
