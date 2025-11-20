import { createLogger } from '@/lib/logger';
import {
  decodeBuffer,
  parseDate,
  parseDecimal,
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
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export async function parseNalCzynszBuffer(
  buffer: Buffer
): Promise<NalCzynszEntry[]> {
  const content = await decodeBuffer(buffer);
  const lines = content.split('\n').filter((line: string) => line.trim());

  const entries: NalCzynszEntry[] = [];

  for (const line of lines) {
    const fields = line.split('#');

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
      const lineNo = parseInt(lineNoStr);
      const quantity = parseDecimal(quantityStr);
      const unitPrice = parseDecimal(unitPriceStr);
      const totalAmount = parseDecimal(totalAmountStr);

      entries.push({
        id: id.trim(),
        apartmentExternalId: apartmentExternalId.trim(),
        dateFrom,
        dateTo,
        period: period.trim(),
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
