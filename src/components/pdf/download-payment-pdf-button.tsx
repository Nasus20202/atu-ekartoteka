'use client';

import { FileDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Payment } from '@/lib/types';
import {
  PAYMENT_AMOUNT_FIELD_KEYS,
  type PaymentPdfDto,
} from '@/lib/types/dto/payment-dto';
import { toDecimal } from '@/lib/utils/decimal';

interface DownloadPaymentPdfButtonProps {
  apartmentLabel: string;
  hoaName: string;
  payment: PaymentPdfDto;
}

export type { PaymentPdfDto };

type PaymentAmountFieldKey = (typeof PAYMENT_AMOUNT_FIELD_KEYS)[number];

export function DownloadPaymentPdfButton({
  apartmentLabel,
  hoaName,
  payment,
}: DownloadPaymentPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
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
          generatedDate={new Date().toISOString().slice(0, 10)}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wplaty-${apartmentLabel}-${payment.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
    >
      <FileDown className="mr-2 h-4 w-4" />
      {loading ? 'Generowanie...' : 'Pobierz PDF'}
    </Button>
  );
}
