import { Document, Text, View } from '@react-pdf/renderer';

import {
  DocumentPage,
  PdfHeader,
  SectionTitle,
  styles,
} from '@/components/pdf/primitives';
import { type Decimal, toDecimal } from '@/lib/money/decimal';
import { sumDecimals } from '@/lib/money/sum';
import {
  CHARGE_MONTH_FIELD_KEYS,
  getNonEmptyMonths,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/payments/empty-months';
import { registerPdfFonts } from '@/lib/pdf/register-fonts';
import type { Payment } from '@/lib/types';
import { formatCurrency, MONTH_NAMES_PL } from '@/lib/utils';

registerPdfFonts();

interface MonthRow {
  name: string;
  payments: Decimal;
  charges: Decimal;
}

function buildMonthlyRows(payment: Payment): MonthRow[] {
  return getNonEmptyMonths(payment).map((month) => ({
    name: MONTH_NAMES_PL[month.monthIndex],
    payments: month.payments,
    charges: month.charges,
  }));
}

export interface PaymentPdfDocumentProps {
  apartmentLabel: string;
  hoaName: string;
  payment: Payment;
  generatedDate: string;
}

interface MonthRowWithBalance extends MonthRow {
  balance: Decimal;
}

function buildRowsWithBalance(
  rows: MonthRow[],
  openingBalance: Decimal
): MonthRowWithBalance[] {
  let running = openingBalance;
  return rows.map((row) => {
    running = running.plus(row.payments).minus(row.charges);
    return { ...row, balance: running };
  });
}

export function PaymentPdfDocument({
  apartmentLabel,
  hoaName,
  payment,
  generatedDate,
}: PaymentPdfDocumentProps) {
  const openingBalance = toDecimal(payment.openingBalance);
  const closingBalance = toDecimal(payment.closingBalance);
  const rows = buildMonthlyRows(payment);
  const totalPayments = sumDecimals(
    PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const totalCharges = sumDecimals(
    CHARGE_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const rowsWithBalance = buildRowsWithBalance(rows, openingBalance);

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
                openingBalance.isNegative() ? styles.red : styles.green,
              ]}
            >
              {formatCurrency(openingBalance)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Naliczenia</Text>
            <Text style={styles.summaryCellValue}>
              {formatCurrency(totalCharges)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Suma wpłat</Text>
            <Text style={styles.summaryCellValue}>
              {formatCurrency(totalPayments)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Saldo końcowe</Text>
            <Text
              style={[
                styles.summaryCellValue,
                closingBalance.isNegative() ? styles.red : styles.green,
              ]}
            >
              {formatCurrency(closingBalance)}
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
            {formatCurrency(payment.openingSurplus)}
          </Text>
          <Text style={styles.cellRight}>
            {formatCurrency(payment.openingDebt)}
          </Text>
          <Text
            style={[
              styles.cellRight,
              openingBalance.isNegative() ? styles.red : styles.green,
            ]}
          >
            {formatCurrency(openingBalance)}
          </Text>
        </View>

        {rowsWithBalance.map((row) => (
          <View key={row.name} style={styles.tableRow}>
            <Text style={styles.cellLeft}>{row.name}</Text>
            <Text style={styles.cellRight}>{formatCurrency(row.payments)}</Text>
            <Text style={styles.cellRight}>{formatCurrency(row.charges)}</Text>
            <Text
              style={[
                styles.cellRight,
                row.balance.isNegative() ? styles.red : styles.green,
              ]}
            >
              {formatCurrency(row.balance)}
            </Text>
          </View>
        ))}

        <View style={styles.tableRowTotal}>
          <Text style={[styles.cellLeft, styles.bold]}>Razem</Text>
          <Text style={[styles.cellRight, styles.bold]}>
            {formatCurrency(totalPayments)}
          </Text>
          <Text style={[styles.cellRight, styles.bold]}>
            {formatCurrency(totalCharges)}
          </Text>
          <Text
            style={[
              styles.cellRight,
              styles.bold,
              closingBalance.isNegative() ? styles.red : styles.green,
            ]}
          >
            {formatCurrency(closingBalance)}
          </Text>
        </View>
      </DocumentPage>
    </Document>
  );
}
