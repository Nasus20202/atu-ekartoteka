import { Document, View } from '@react-pdf/renderer';

import { PdfItemsTable } from '@/components/pdf/items-table';
import {
  DocumentPage,
  PdfHeader,
  SectionTitle,
} from '@/components/pdf/primitives';
import { registerPdfFonts } from '@/lib/pdf/register-fonts';
import type { ChargeDisplay } from '@/lib/types';
import type { DecimalLike } from '@/lib/utils/decimal';

registerPdfFonts();

export interface ChargePeriodGroup {
  period: string;
  periodLabel: string;
  charges: ChargeDisplay[];
  total: DecimalLike;
}

export interface ChargePdfDocumentProps {
  apartmentLabel: string;
  hoaName: string;
  periodGroups: ChargePeriodGroup[];
  generatedDate: string;
}

export function ChargePdfDocument({
  apartmentLabel,
  hoaName,
  periodGroups,
  generatedDate,
}: ChargePdfDocumentProps) {
  return (
    <Document>
      <DocumentPage>
        <PdfHeader
          title={`Naliczenia - ${apartmentLabel}`}
          subtitle={`${hoaName} | Wygenerowano: ${generatedDate}`}
        />

        {periodGroups.map((group) => (
          <View key={group.period}>
            <SectionTitle>{group.periodLabel}</SectionTitle>

            <PdfItemsTable items={group.charges} total={group.total} />
          </View>
        ))}
      </DocumentPage>
    </Document>
  );
}
