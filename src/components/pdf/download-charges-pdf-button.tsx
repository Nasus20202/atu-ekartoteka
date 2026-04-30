'use client';

import { FileDown } from 'lucide-react';
import { useState } from 'react';

import type { ChargePeriodGroup } from '@/components/pdf/charge-pdf-document';
import { Button } from '@/components/ui/button';
import type { SerializableCharge } from '@/lib/charges/serialize-charge';
import { sumDecimals } from '@/lib/money/sum';
import { formatPeriod } from '@/lib/utils';

interface DownloadChargesPdfButtonProps {
  apartmentLabel: string;
  hoaName: string;
  period: string;
  charges: SerializableCharge[];
}

export type { SerializableCharge };

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
        total: sumDecimals(charges.map((charge) => charge.totalAmount)),
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
