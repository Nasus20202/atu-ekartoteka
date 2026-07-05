import { Prisma } from '@/generated/prisma/client';
import { createLogger } from '@/lib/logger';
import {
  decodeBuffer,
  parseDate,
  parseDecimalValue,
} from '@/lib/parsers/parser-utils';

const logger = createLogger('parser:nal-czynsz');

export interface NalCzynszEntry {
  id: string;
  apartmentExternalId: string;
  dateFrom: Date;
  dateTo: Date;
  period: string;
  lineNo: number;
  description: string;
  quantity: Prisma.Decimal;
  unit: string;
  unitPrice: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

export async function parseNalCzynszBuffer(
  buffer: Buffer
): Promise<NalCzynszEntry[]> {
  const content = await decodeBuffer(buffer);
  const lines = content.split(/\r?\n/).filter((line: string) => line.trim());

  const entries: NalCzynszEntry[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const fields = line.split('#').map((field) => field.trim());

    if (fields.length < 11) {
      continue;
    }

    const [
      id,
      apartmentExternalId,
      dateFromStr,
      dateToStr,
      period,
      lineNoStr,
      description,
      quantityStr,
      unit,
      unitPriceStr,
      totalAmountStr,
    ] = fields;

    try {
      const dateFrom = parseDate(dateFromStr);
      const dateTo = parseDate(dateToStr);
      const originalLineNo = parseInt(lineNoStr);
      const quantity = parseDecimalValue(quantityStr);
      const unitPrice = parseDecimalValue(unitPriceStr);
      const totalAmount = parseDecimalValue(totalAmountStr);

      const aId = apartmentExternalId.trim();
      const p = period.trim();
      const key = `${aId}|${p}|${originalLineNo}`;
      const seenCount = seen.get(key) ?? 0;
      seen.set(key, seenCount + 1);

      const lineNo =
        seenCount === 0
          ? originalLineNo
          : originalLineNo + 1_000_000 * seenCount;

      if (seenCount > 0) {
        logger.info(
          {
            id: id.trim(),
            apartmentExternalId: aId,
            period: p,
            originalLineNo,
            syntheticLineNo: lineNo,
            occurrence: seenCount + 1,
          },
          'Duplicate charge line detected, assigned synthetic line number'
        );
      }

      entries.push({
        id: id.trim(),
        apartmentExternalId: aId,
        dateFrom,
        dateTo,
        period: p,
        lineNo,
        description: description.trim(),
        quantity,
        unit: unit.trim(),
        unitPrice,
        totalAmount,
      });
    } catch (error) {
      logger.debug({ line, error }, 'Failed to parse line');
      continue;
    }
  }

  return entries;
}
