import { Document, Text, View } from '@react-pdf/renderer';

import {
  DocumentPage,
  PdfHeader,
  SectionTitle,
  styles,
} from '@/components/pdf/primitives';
import { type DecimalLike, toDecimal } from '@/lib/money/decimal';
import { registerPdfFonts } from '@/lib/pdf/register-fonts';
import type { ChargeDisplay } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

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

            {/* Table header */}
            <View style={styles.tableRowHeader}>
              <Text style={[styles.cellLeft, styles.bold]}>Opis</Text>
              <Text style={[styles.cellRight, styles.bold]}>Ilość</Text>
              <Text style={[styles.cellRight, styles.bold]}>Cena jedn.</Text>
              <Text style={[styles.cellRight, styles.bold]}>Razem</Text>
            </View>

            {/* Charge rows */}
            {group.charges.map((charge) => (
              <View key={charge.id} style={styles.tableRow}>
                <Text style={styles.cellLeft}>{charge.description}</Text>
                <Text style={styles.cellRight}>
                  {toDecimal(charge.quantity).toString()} {charge.unit}
                </Text>
                <Text style={styles.cellRight}>
                  {formatCurrency(charge.unitPrice)}
                </Text>
                <Text style={styles.cellRight}>
                  {formatCurrency(charge.totalAmount)}
                </Text>
              </View>
            ))}

            {/* Period total */}
            <View style={styles.tableRowTotal}>
              <Text style={[styles.cellLeft, styles.bold]}>Razem</Text>
              <Text style={styles.cellRight} />
              <Text style={styles.cellRight} />
              <Text style={[styles.cellRight, styles.bold]}>
                {formatCurrency(group.total)}
              </Text>
            </View>
          </View>
        ))}
      </DocumentPage>
    </Document>
  );
}
