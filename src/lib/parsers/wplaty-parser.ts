import {
  decodeBuffer,
  parseDate,
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

    if (parts.length >= 33) {
      const externalId = parts[0].trim();
      const apartmentCode = parts[1].trim();
      const year = parseInt(parts[2].trim(), 10);
      const dateFrom = parseDate(parts[3].trim());
      const dateTo = parseDate(parts[4].trim());
      const openingBalance = parseFloat(parts[5].trim().replace(',', '.'));
      const totalCharges = parseFloat(parts[6].trim().replace(',', '.'));

      const monthlyPayments: number[] = [];
      for (let i = 0; i < 12; i++) {
        const paymentIndex = 7 + i * 2 + 1;

        const payment = parseFloat(
          parts[paymentIndex]?.trim().replace(',', '.') || '0'
        );
        monthlyPayments.push(payment);
      }

      const closingBalance = parseFloat(
        parts[parts.length - 1].trim().replace(',', '.')
      );

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
          monthlyPayments,
          closingBalance,
        });
      }
    }
  }

  return { entries };
}
