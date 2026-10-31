'use client';

import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import type { Payment } from '@/lib/types';
import {
  PAYMENT_AMOUNT_FIELD_KEYS,
  type PaymentPdfDto,
} from '@/lib/types/dto/payment-dto';
import { toDecimal } from '@/lib/utils/decimal';
import { toLocalIsoDate } from '@/lib/utils/local-date';

interface DownloadPaymentPdfButtonProps {
  apartmentLabel: string;
  hoaName: string;
  payment: PaymentPdfDto;
  compact?: boolean;
}

export type { PaymentPdfDto };

type PaymentAmountFieldKey = (typeof PAYMENT_AMOUNT_FIELD_KEYS)[number];

export function DownloadPaymentPdfButton({
  apartmentLabel,
  hoaName,
  payment,
  compact,
}: DownloadPaymentPdfButtonProps) {
  const createPdf = async () => {
    const { pdf } = await import('@react-pdf/renderer');
    const { PaymentPdfDocument } =
      await import('@/components/pdf/payment-pdf-document');

    const hydratedAmounts = Object.fromEntries(
      PAYMENT_AMOUNT_FIELD_KEYS.map((key) => [key, toDecimal(payment[key])])
    ) as Pick<Payment, PaymentAmountFieldKey>;

    const hydratedPayment: Payment = {
      ...payment,
      ...hydratedAmounts,
      dateFrom: new Date(payment.dateFrom),
      dateTo: new Date(payment.dateTo),
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt),
    };

    const blob = await pdf(
      <PaymentPdfDocument
        apartmentLabel={apartmentLabel}
        hoaName={hoaName}
        payment={hydratedPayment}
        generatedDate={toLocalIsoDate(new Date())}
      />
    ).toBlob();

    return { blob, fileName: `wplaty-${apartmentLabel}-${payment.year}.pdf` };
  };

  return (
    <PdfDownloadButton
      label={`Pobierz PDF wpłat: rok ${payment.year}`}
      compact={compact}
      createPdf={createPdf}
    />
  );
}
