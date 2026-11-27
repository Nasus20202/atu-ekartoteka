import { Document, Text, View } from '@react-pdf/renderer';

import { PdfSectionHeading } from '@/components/pdf/pdf-section-heading';
import {
  DocumentPage,
  SectionTitle,
  styles,
} from '@/components/pdf/primitives';
import { ReadingsPdfTable } from '@/components/pdf/readings-pdf-table';
import { SettlementLinesPdfTable } from '@/components/pdf/settlement-lines-pdf-table';
import {
  RESULT_COLORS,
  SettlementPdfDetails,
  SettlementPdfHeader,
  SettlementPdfResult,
  type SettlementPdfSubject,
} from '@/components/pdf/settlement-pdf-parts';
import { registerPdfFonts } from '@/lib/platform/pdf/register-fonts';
import type {
  UtilityDto,
  UtilitySettlementDto,
} from '@/lib/settlements/dto/settlement-view-dto';
import { periodMeters } from '@/lib/settlements/rules/period-meters';
import {
  formatAbsoluteAmount,
  formatRange,
  formatVolume,
} from '@/lib/settlements/rules/view-format';
import {
  RESULT_LABELS,
  resultKind,
  utilityHeading,
  utilityResultTitle,
} from '@/lib/settlements/rules/view-wording';
import { formatCurrency } from '@/lib/shared/utils';

registerPdfFonts();

// A utility starts on a new page when only its heading would fit
const MIN_SPACE_FOR_UTILITY = 90;

function UtilitySection({ utility }: { utility: UtilityDto }) {
  const { name, code, unit, amount } = utility;
  const kind = resultKind(amount);

  return (
    <>
      <View wrap={false} minPresenceAhead={MIN_SPACE_FOR_UTILITY}>
        <SectionTitle>{utilityHeading(name, code)}</SectionTitle>
        <Text style={[styles.bold, RESULT_COLORS[kind]]}>
          {RESULT_LABELS[kind]}: {formatAbsoluteAmount(amount)}
        </Text>
        <Text style={[styles.muted, { marginBottom: 6 }]}>
          Zużycie {formatVolume(utility.consumption, unit)}, zaliczka{' '}
          {formatVolume(utility.advanceQuantity, unit)}
        </Text>
      </View>
      <SettlementLinesPdfTable lines={utility.lines} total={utility} />
    </>
  );
}

interface Props extends SettlementPdfSubject {
  settlement: UtilitySettlementDto;
}

export function UtilitySettlementPdfDocument({
  settlement,
  ...subject
}: Props) {
  const meters = periodMeters(settlement).map(({ meter }) => meter);

  return (
    <Document>
      <DocumentPage>
        <SettlementPdfHeader
          {...subject}
          title="Rozliczenie mediów"
          printedOwner={settlement.printedOwner}
          period={formatRange(settlement.periodFrom, settlement.periodTo)}
        />
        <SettlementPdfResult
          title={utilityResultTitle(settlement.totalAmount)}
          amount={settlement.totalAmount}
          detail={`Suma zaliczek ${formatCurrency(settlement.advanceAmount)} · koszt zużycia ${formatCurrency(settlement.consumptionAmount)}`}
        />
        {settlement.utilities.map((utility) => (
          <UtilitySection key={utility.code} utility={utility} />
        ))}
        {settlement.otherLines.length > 0 && (
          <>
            <PdfSectionHeading>Pozostałe</PdfSectionHeading>
            <SettlementLinesPdfTable lines={settlement.otherLines} />
          </>
        )}
        {meters.length > 0 && (
          <>
            <PdfSectionHeading>Odczyty liczników</PdfSectionHeading>
            <ReadingsPdfTable readings={meters} />
          </>
        )}
        <SettlementPdfDetails origin={settlement.origin} />
      </DocumentPage>
    </Document>
  );
}
