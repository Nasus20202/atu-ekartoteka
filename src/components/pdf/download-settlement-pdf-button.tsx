'use client';

import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import type { SettlementViewKey } from '@/components/settlements/settlement-view-key';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';
import { toLocalIsoDate } from '@/lib/shared/utils/local-date';

interface Props {
  view: SettlementViewKey;
  data: ApartmentSettlementsDto;
  apartmentLabel: string;
  hoaName: string;
}

/** Builds the document of one view, or null when the view has nothing. */
function pdfOfView({ view, data, apartmentLabel, hoaName }: Props) {
  const { utility, annual, readings } = data;
  const subject = () => ({
    apartmentLabel,
    hoaName,
    generatedDate: toLocalIsoDate(new Date()),
  });

  if (view === 'annual') {
    return (
      annual && {
        fileName: `koszty-rzeczywiste-${apartmentLabel}-${annual.periodFrom}-${annual.periodTo}.pdf`,
        document: async () => {
          const { AnnualCostsPdfDocument } =
            await import('@/components/pdf/annual-costs-pdf-document');
          return <AnnualCostsPdfDocument {...subject()} settlement={annual} />;
        },
      }
    );
  }

  if (!utility) return null;

  if (view === 'media') {
    return {
      fileName: `rozliczenie-mediow-${apartmentLabel}-${utility.periodFrom}-${utility.periodTo}.pdf`,
      document: async () => {
        const { UtilitySettlementPdfDocument } =
          await import('@/components/pdf/utility-settlement-pdf-document');
        return (
          <UtilitySettlementPdfDocument {...subject()} settlement={utility} />
        );
      },
    };
  }

  if (readings.length === 0) return null;

  return {
    fileName: `liczniki-${apartmentLabel}-${toLocalIsoDate(new Date())}.pdf`,
    document: async () => {
      const { MetersPdfDocument } =
        await import('@/components/pdf/meters-pdf-document');
      return (
        <MetersPdfDocument
          {...subject()}
          settlement={utility}
          readings={readings}
        />
      );
    },
  };
}

export function DownloadSettlementPdfButton(props: Props) {
  const target = pdfOfView(props);
  if (!target) return null;

  const createPdf = async () => {
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(await target.document()).toBlob();
    return { blob, fileName: target.fileName };
  };

  return (
    <PdfDownloadButton label="Pobierz PDF rozliczenia" createPdf={createPdf} />
  );
}
