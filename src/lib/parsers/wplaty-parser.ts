import {
  decodeBuffer,
  parseDate,
  parseDecimal,
  ParseResult,
} from '@/lib/parsers/parser-utils';

export interface PaymentEntry {
  externalId: string;
  apartmentCode: string;
  year: number;
  dateFrom: Date;
  dateTo: Date;
  openingBalance: number;
  totalCharges: number;
  monthlyCharges: number[];
  monthlyPayments: number[];
  closingBalance: number;
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
      const openingDebt = parseDecimal(parts[5].trim());
      const openingSurplus = parseDecimal(parts[6].trim());
      // The file expresses opening debt and surplus separately - balance is surplus - debt
      const openingBalance = openingSurplus - openingDebt;

      const monthlyCharges: number[] = [];
      const monthlyPayments: number[] = [];
      for (let i = 0; i < 12; i++) {
        const chargesIndex = 9 + i * 2;
        const paymentsIndex = 10 + i * 2;

        const charge = parseDecimal(parts[chargesIndex]?.trim() || '0');
        const payment = parseDecimal(parts[paymentsIndex]?.trim() || '0');
        monthlyCharges.push(charge);
        monthlyPayments.push(payment);
      }

      const totalCharges = monthlyCharges.reduce((sum, c) => sum + c, 0);
      const closingBalance = parseDecimal(parts[33].trim());

      if (
        !isNaN(year) &&
        !isNaN(openingBalance) &&
        !isNaN(totalCharges) &&
        !isNaN(closingBalance)
      ) {
        entries.push({
          externalId,
          apartmentCode,
          year,
          dateFrom,
          dateTo,
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
