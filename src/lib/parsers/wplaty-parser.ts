import { Prisma } from '@/generated/prisma/client';
import { sumDecimals } from '@/lib/money/sum';
import {
  decodeBuffer,
  parseDate,
  parseDecimalValue,
  ParseResult,
} from '@/lib/parsers/parser-utils';

export interface PaymentEntry {
  externalId: string;
  apartmentCode: string;
  year: number;
  dateFrom: Date;
  dateTo: Date;
  openingDebt: Prisma.Decimal;
  openingSurplus: Prisma.Decimal;
  openingBalance: Prisma.Decimal;
  totalCharges: Prisma.Decimal;
  monthlyCharges: Prisma.Decimal[];
  monthlyPayments: Prisma.Decimal[];
  closingBalance: Prisma.Decimal;
}

export async function parseWplatyFile(
  buffer: Buffer
): Promise<ParseResult<PaymentEntry>> {
  const content = await decodeBuffer(buffer);
  const lines = content.split('\n');
  const entries: PaymentEntry[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || !trimmedLine.includes('#')) {
      continue;
    }

    const parts = trimmedLine.split('#');

    if (parts.length >= 34) {
      const externalId = parts[0].trim();
      const apartmentCode = parts[1].trim();
      const year = parseInt(parts[2].trim(), 10);
      const dateFrom = parseDate(parts[3].trim());
      const dateTo = parseDate(parts[4].trim());
      const openingDebt = parseDecimalValue(parts[5].trim());
      const openingSurplus = parseDecimalValue(parts[6].trim());
      // The file expresses opening debt and surplus separately - balance is surplus - debt
      const openingBalance = openingSurplus.minus(openingDebt);

      const monthlyCharges: Prisma.Decimal[] = [];
      const monthlyPayments: Prisma.Decimal[] = [];
      for (let i = 0; i < 12; i++) {
        const chargesIndex = 9 + i * 2;
        const paymentsIndex = 10 + i * 2;

        const charge = parseDecimalValue(parts[chargesIndex]?.trim() || '0');
        const payment = parseDecimalValue(parts[paymentsIndex]?.trim() || '0');
        monthlyCharges.push(charge);
        monthlyPayments.push(payment);
      }

      const totalCharges = sumDecimals(monthlyCharges);
      const closingBalance = parseDecimalValue(parts[33].trim());

      if (
        !isNaN(year) &&
        !openingBalance.isNaN() &&
        !totalCharges.isNaN() &&
        !closingBalance.isNaN()
      ) {
        entries.push({
          externalId,
          apartmentCode,
          year,
          dateFrom,
          dateTo,
          openingDebt,
          openingSurplus,
          openingBalance,
          totalCharges,
          monthlyCharges,
          monthlyPayments,
          closingBalance,
        });
      }
    }
  }

  return { entries };
}
