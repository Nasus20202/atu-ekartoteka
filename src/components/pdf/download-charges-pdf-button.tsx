'use client';

import { FileDown } from 'lucide-react';
import { useState } from 'react';

import type { ChargePeriodGroup } from '@/components/pdf/charge-pdf-document';
import { Button } from '@/components/ui/button';
import { formatPeriod } from '@/lib/utils';

export interface SerializableCharge {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

interface DownloadChargesPdfButtonProps {
  apartmentLabel: string;
  hoaName: string;
  period: string;
  charges: SerializableCharge[];
}

export function DownloadChargesPdfButton({
  apartmentLabel,
  hoaName,
  period,
  charges,
}: DownloadChargesPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { ChargePdfDocument } =
        await import('@/components/pdf/charge-pdf-document');

      const periodGroup: ChargePeriodGroup = {
        period,
        periodLabel: formatPeriod(period),
        charges: charges.map((c) => ({
          ...c,
          dateFrom: new Date(0),
          dateTo: new Date(0),
        })),
        total: charges.reduce((s, c) => s + c.totalAmount, 0),
      };

      const generatedDate = new Date().toISOString().slice(0, 10);
      const blob = await pdf(
        <ChargePdfDocument
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          periodGroups={[periodGroup]}
          generatedDate={generatedDate}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `naliczenia-${apartmentLabel}-${period}.pdf`;
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
