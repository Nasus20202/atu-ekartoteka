'use client';

import type { ChargePeriodGroup } from '@/components/pdf/charge-pdf-document';
import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import type { ChargePdfItemDto } from '@/lib/types/dto/charge-dto';
import { formatPeriod } from '@/lib/utils';
import { toLocalIsoDate } from '@/lib/utils/local-date';
import { sumDecimals } from '@/lib/utils/sum';

interface DownloadChargesPdfButtonProps {
  apartmentLabel: string;
  hoaName: string;
  period: string;
  charges: ChargePdfItemDto[];
  compact?: boolean;
}

export type { ChargePdfItemDto };

export function DownloadChargesPdfButton({
  apartmentLabel,
  hoaName,
  period,
  charges,
  compact,
}: DownloadChargesPdfButtonProps) {
  const createPdf = async () => {
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

    const generatedDate = toLocalIsoDate(new Date());
    const blob = await pdf(
      <ChargePdfDocument
        apartmentLabel={apartmentLabel}
        hoaName={hoaName}
        periodGroups={[periodGroup]}
        generatedDate={generatedDate}
      />
    ).toBlob();

    return { blob, fileName: `naliczenia-${apartmentLabel}-${period}.pdf` };
  };

  return (
    <PdfDownloadButton
      label={`Pobierz PDF naliczeń: ${formatPeriod(period)}`}
      compact={compact}
      createPdf={createPdf}
    />
  );
}
