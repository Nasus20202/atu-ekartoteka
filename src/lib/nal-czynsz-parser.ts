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

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function parseDecimal(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

export async function parseNalCzynszBuffer(
  buffer: Buffer
): Promise<NalCzynszEntry[]> {
  const iconv = await import('iconv-lite');
  const content = iconv.decode(buffer, 'iso-8859-2');
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
      console.error(`Failed to parse line: ${line}`, error);
      continue;
    }
  }

  return entries;
}
