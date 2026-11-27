import { StyleSheet, Text, View } from '@react-pdf/renderer';

import { PdfHeader, type PdfStyle, styles } from '@/components/pdf/primitives';
import type { SettlementOriginDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatDay } from '@/lib/settlements/rules/format';
import { formatAbsoluteAmount } from '@/lib/settlements/rules/view-format';
import {
  type ResultKind,
  resultKind,
} from '@/lib/settlements/rules/view-wording';

const partStyles = StyleSheet.create({
  subject: { marginTop: -8, marginBottom: 12, gap: 3 },
  result: { borderRadius: 6, borderWidth: 1, padding: 12, marginBottom: 12 },
  amount: { fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  details: { marginTop: 18, fontSize: 8, lineHeight: 1.5 },
});

const RESULT_BOXES: Record<ResultKind, PdfStyle> = {
  overpaid: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  due: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  even: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
};

export const RESULT_COLORS: Record<ResultKind, PdfStyle> = {
  overpaid: styles.green,
  due: styles.red,
  even: {},
};

/** Who and what every settlement document is about. */
export interface SettlementPdfSubject {
  apartmentLabel: string;
  hoaName: string;
  generatedDate: string;
}

interface HeaderProps extends SettlementPdfSubject {
  title: string;
  printedOwner: string;
  period: string;
}

export function SettlementPdfHeader({
  title,
  apartmentLabel,
  hoaName,
  generatedDate,
  printedOwner,
  period,
}: HeaderProps) {
  return (
    <>
      <PdfHeader
        title={`${title} - ${apartmentLabel}`}
        subtitle={`${hoaName} | Wygenerowano: ${generatedDate}`}
      />
      <View style={partStyles.subject}>
        <Text>Lokal: {apartmentLabel}</Text>
        <Text>Właściciel: {printedOwner}</Text>
        <Text>Okres: {period}</Text>
      </View>
    </>
  );
}

interface ResultProps {
  title: string;
  amount: string;
  detail: string;
}

export function SettlementPdfResult({ title, amount, detail }: ResultProps) {
  const kind = resultKind(amount);

  return (
    <View style={[partStyles.result, RESULT_BOXES[kind]]}>
      <Text style={[styles.bold, RESULT_COLORS[kind]]}>{title}</Text>
      <Text style={[partStyles.amount, RESULT_COLORS[kind]]}>
        {formatAbsoluteAmount(amount)}
      </Text>
      <Text style={styles.muted}>{detail}</Text>
    </View>
  );
}

export function SettlementPdfDetails({
  origin,
}: {
  origin: SettlementOriginDto | null;
}) {
  if (!origin) return null;

  return (
    <View style={[partStyles.details, styles.muted]} wrap={false}>
      <Text>Data wystawienia: {formatDay(origin.issuedOn)}</Text>
      <Text>Plik źródłowy: {origin.sourceFileName}</Text>
    </View>
  );
}
