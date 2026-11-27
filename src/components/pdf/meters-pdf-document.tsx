import { Document, Text, View } from '@react-pdf/renderer';

import { PdfSectionHeading } from '@/components/pdf/pdf-section-heading';
import { DocumentPage, styles } from '@/components/pdf/primitives';
import { ReadingsPdfTable } from '@/components/pdf/readings-pdf-table';
import {
  SettlementPdfDetails,
  SettlementPdfHeader,
  type SettlementPdfSubject,
} from '@/components/pdf/settlement-pdf-parts';
import { registerPdfFonts } from '@/lib/platform/pdf/register-fonts';
import type {
  MeterReadingDto,
  UtilitySettlementDto,
} from '@/lib/settlements/dto/settlement-view-dto';
import { formatDay } from '@/lib/settlements/rules/format';
import { periodMeters } from '@/lib/settlements/rules/period-meters';
import { formatRange, formatVolume } from '@/lib/settlements/rules/view-format';

registerPdfFonts();

/** From the first start reading to the last end reading. */
function readingSpan(readings: MeterReadingDto[]) {
  const starts = readings.map((reading) => reading.startDate).sort();
  const ends = readings.map((reading) => reading.endDate).sort();
  return formatRange(starts[0], ends[ends.length - 1]);
}

interface Props extends SettlementPdfSubject {
  /** The chosen period, whose meters are highlighted */
  settlement: UtilitySettlementDto;
  readings: MeterReadingDto[];
}

export function MetersPdfDocument({ settlement, readings, ...subject }: Props) {
  return (
    <Document>
      <DocumentPage>
        <SettlementPdfHeader
          {...subject}
          title="Liczniki"
          printedOwner={settlement.printedOwner}
          period={readingSpan(readings)}
        />
        <View style={styles.summaryGrid}>
          {periodMeters(settlement).map(({ meter, heading }) => (
            <View key={meter.id} style={styles.summaryCell} wrap={false}>
              <Text style={styles.bold}>{heading}</Text>
              <Text style={styles.summaryCellLabel}>
                Licznik nr {meter.serialNumber}
              </Text>
              <Text style={styles.summaryCellValue}>
                {formatVolume(meter.endValue, meter.unit)}
              </Text>
              <Text style={styles.summaryCellLabel}>
                stan na {formatDay(meter.endDate)}
              </Text>
              <Text>
                Zużycie w okresie: {formatVolume(meter.consumption, meter.unit)}
              </Text>
            </View>
          ))}
        </View>
        <PdfSectionHeading>Odczyty</PdfSectionHeading>
        <ReadingsPdfTable readings={readings} />
        <SettlementPdfDetails origin={settlement.origin} />
      </DocumentPage>
    </Document>
  );
}
