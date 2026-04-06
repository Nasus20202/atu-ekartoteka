import { Document, Text, View } from '@react-pdf/renderer';

import {
  DocumentPage,
  PdfHeader,
  SectionTitle,
  styles,
} from '@/components/pdf/primitives';
import { registerPdfFonts } from '@/lib/pdf/register-fonts';
import type { Payment } from '@/lib/types';
import { MONTH_NAMES_PL } from '@/lib/utils';

registerPdfFonts();

interface MonthRow {
  name: string;
  payments: number;
  charges: number;
}

function buildMonthlyRows(payment: Payment): MonthRow[] {
  return [
    {
      name: MONTH_NAMES_PL[0],
      payments: payment.januaryPayments,
      charges: payment.januaryCharges,
    },
    {
      name: MONTH_NAMES_PL[1],
      payments: payment.februaryPayments,
      charges: payment.februaryCharges,
    },
    {
      name: MONTH_NAMES_PL[2],
      payments: payment.marchPayments,
      charges: payment.marchCharges,
    },
    {
      name: MONTH_NAMES_PL[3],
      payments: payment.aprilPayments,
      charges: payment.aprilCharges,
    },
    {
      name: MONTH_NAMES_PL[4],
      payments: payment.mayPayments,
      charges: payment.mayCharges,
    },
    {
      name: MONTH_NAMES_PL[5],
      payments: payment.junePayments,
      charges: payment.juneCharges,
    },
    {
      name: MONTH_NAMES_PL[6],
      payments: payment.julyPayments,
      charges: payment.julyCharges,
    },
    {
      name: MONTH_NAMES_PL[7],
      payments: payment.augustPayments,
      charges: payment.augustCharges,
    },
    {
      name: MONTH_NAMES_PL[8],
      payments: payment.septemberPayments,
      charges: payment.septemberCharges,
    },
    {
      name: MONTH_NAMES_PL[9],
      payments: payment.octoberPayments,
      charges: payment.octoberCharges,
    },
    {
      name: MONTH_NAMES_PL[10],
      payments: payment.novemberPayments,
      charges: payment.novemberCharges,
    },
    {
      name: MONTH_NAMES_PL[11],
      payments: payment.decemberPayments,
      charges: payment.decemberCharges,
    },
  ];
}

export interface PaymentPdfDocumentProps {
  apartmentLabel: string;
  hoaName: string;
  payment: Payment;
  generatedDate: string;
}

interface MonthRowWithBalance extends MonthRow {
  balance: number;
}

function buildRowsWithBalance(
  rows: MonthRow[],
  openingBalance: number
): MonthRowWithBalance[] {
  let running = openingBalance;
  return rows.map((row) => {
    running += row.payments - row.charges;
    return { ...row, balance: running };
  });
}

export function PaymentPdfDocument({
  apartmentLabel,
  hoaName,
  payment,
  generatedDate,
}: PaymentPdfDocumentProps) {
  const rows = buildMonthlyRows(payment);
  const totalPayments = rows.reduce((s, r) => s + r.payments, 0);
  const totalCharges = rows.reduce((s, r) => s + r.charges, 0);
  const rowsWithBalance = buildRowsWithBalance(rows, payment.openingBalance);

  return (
    <Document>
      <DocumentPage>
        <PdfHeader
          title={`Wpłaty ${payment.year} - ${apartmentLabel}`}
          subtitle={`${hoaName} | Wygenerowano: ${generatedDate}`}
        />

        {/* Summary */}
        <SectionTitle>Podsumowanie roku {payment.year}</SectionTitle>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Saldo początkowe</Text>
            <Text
              style={[
                styles.summaryCellValue,
                payment.openingBalance < 0 ? styles.red : styles.green,
              ]}
            >
              {payment.openingBalance.toFixed(2)} zł
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Naliczenia</Text>
            <Text style={styles.summaryCellValue}>
              {totalCharges.toFixed(2)} zł
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Suma wpłat</Text>
            <Text style={styles.summaryCellValue}>
              {totalPayments.toFixed(2)} zł
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Saldo końcowe</Text>
            <Text
              style={[
                styles.summaryCellValue,
                payment.closingBalance < 0 ? styles.red : styles.green,
              ]}
            >
              {payment.closingBalance.toFixed(2)} zł
            </Text>
          </View>
        </View>

        {/* Monthly table */}
        <SectionTitle>Wpłaty i naliczenia miesięczne</SectionTitle>

        <View style={styles.tableRowHeader}>
          <Text style={[styles.cellLeft, styles.bold]}>Miesiąc</Text>
          <Text style={[styles.cellRight, styles.bold]}>Wpłaty</Text>
          <Text style={[styles.cellRight, styles.bold]}>Naliczenia</Text>
          <Text style={[styles.cellRight, styles.bold]}>Saldo</Text>
        </View>

        {/* Opening balance row */}
        <View style={styles.tableRow}>
          <Text style={[styles.cellLeft, styles.muted]}>Bilans otwarcia</Text>
          <Text style={styles.cellRight}>
            {payment.openingSurplus.toFixed(2)} zł
          </Text>
          <Text style={styles.cellRight}>
            {payment.openingDebt.toFixed(2)} zł
          </Text>
          <Text
            style={[
              styles.cellRight,
              payment.openingBalance < 0 ? styles.red : styles.green,
            ]}
          >
            {payment.openingBalance.toFixed(2)} zł
          </Text>
        </View>

        {rowsWithBalance.map((row) => (
          <View key={row.name} style={styles.tableRow}>
            <Text style={styles.cellLeft}>{row.name}</Text>
            <Text style={styles.cellRight}>{row.payments.toFixed(2)} zł</Text>
            <Text style={styles.cellRight}>{row.charges.toFixed(2)} zł</Text>
            <Text
              style={[
                styles.cellRight,
                row.balance < 0 ? styles.red : styles.green,
              ]}
            >
              {row.balance.toFixed(2)} zł
            </Text>
          </View>
        ))}

        <View style={styles.tableRowTotal}>
          <Text style={[styles.cellLeft, styles.bold]}>Razem</Text>
          <Text style={[styles.cellRight, styles.bold]}>
            {totalPayments.toFixed(2)} zł
          </Text>
          <Text style={[styles.cellRight, styles.bold]}>
            {totalCharges.toFixed(2)} zł
          </Text>
          <Text
            style={[
              styles.cellRight,
              styles.bold,
              payment.closingBalance < 0 ? styles.red : styles.green,
            ]}
          >
            {payment.closingBalance.toFixed(2)} zł
          </Text>
        </View>
      </DocumentPage>
    </Document>
  );
}
