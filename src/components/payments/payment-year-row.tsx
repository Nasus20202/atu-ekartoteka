'use client';

import Link from 'next/link';

import {
  DownloadPaymentPdfButton,
  type SerializablePayment,
} from '@/components/pdf/download-payment-pdf-button';

type PaymentYearRowProps = {
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
  payment: SerializablePayment;
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
      href={`/dashboard/payments/${apartmentId}/${payment.year}`}
      className="flex flex-wrap items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
    >
      <div className="min-w-0 shrink-0">
        <div className="font-medium">Rok {payment.year}</div>
        <div className="text-sm text-muted-foreground">
          {dateFromLabel} - {dateToLabel}
        </div>
      </div>
      <div onClick={(e) => e.preventDefault()} className="shrink-0">
        <DownloadPaymentPdfButton
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          payment={payment}
        />
      </div>
      <div className="ml-auto text-right">
        <div
          className={`text-xl font-bold ${
            payment.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {payment.closingBalance.toFixed(2)} zł
        </div>
        <div className="text-sm text-muted-foreground">Saldo końcowe</div>
      </div>
    </Link>
  );
}
