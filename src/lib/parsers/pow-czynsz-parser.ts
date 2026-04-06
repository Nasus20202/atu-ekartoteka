import { decodeBuffer, ParseResult } from '@/lib/parsers/parser-utils';

export interface ChargeNotificationEntry {
  externalId: string;
  apartmentCode: string;
  lineNo: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

const SECTION_SEPARATOR = '#';

export async function parsePowCzynszFile(
  buffer: Buffer
): Promise<ParseResult<ChargeNotificationEntry>> {
  const content = await decodeBuffer(buffer);
  const lines = content.split('\n');
  const entries: ChargeNotificationEntry[] = [];
  const headerLines: string[] = [];
  const footerLines: string[] = [];

  // The file structure uses two standalone '#' lines as section separators:
  //   lines before first '#'  → header
  //   lines between '#' and second '#' → footer
  //   lines after second '#' → data entries
  let separatorCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === SECTION_SEPARATOR) {
      separatorCount++;
      continue;
    }

    if (separatorCount === 0) {
      if (trimmed) headerLines.push(trimmed);
      continue;
    }

    if (separatorCount === 1 && !trimmed.includes(SECTION_SEPARATOR)) {
      if (trimmed) footerLines.push(trimmed);
      continue;
    }

    if (!trimmed || !trimmed.includes(SECTION_SEPARATOR)) {
      continue;
    }

    const parts = trimmed.split(SECTION_SEPARATOR);

    if (parts.length >= 8) {
      const externalId = parts[0].trim();
      const apartmentCode = parts[1].trim();
      const lineNo = parseInt(parts[2].trim(), 10);
      const description = parts[3].trim();
      const quantity = parseFloat(parts[4].replace(',', '.').trim());
      const unit = parts[5].trim();
      const unitPrice = parseFloat(parts[6].replace(',', '.').trim());
      const totalAmount = parseFloat(parts[7].replace(',', '.').trim());

      if (
        !isNaN(lineNo) &&
        !isNaN(quantity) &&
        !isNaN(unitPrice) &&
        !isNaN(totalAmount)
      ) {
        entries.push({
          externalId,
          apartmentCode,
          lineNo,
          description,
          quantity,
          unit,
          unitPrice,
          totalAmount,
        });
      }
    }
  }

  return {
    header: headerLines,
    footer: footerLines,
    entries,
  };
}
