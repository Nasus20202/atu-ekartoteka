'use client';

import { FileDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Payment } from '@/lib/types';

export type SerializablePayment = Omit<
  Payment,
  'dateFrom' | 'dateTo' | 'createdAt' | 'updatedAt'
> & {
  dateFrom: string;
  dateTo: string;
  createdAt: string;
  updatedAt: string;
};

interface DownloadPaymentPdfButtonProps {
  apartmentLabel: string;
  hoaName: string;
  payment: SerializablePayment;
}

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

      const hydratedPayment: Payment = {
        ...payment,
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
