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

export async function parsePowCzynszFile(
  buffer: Buffer
): Promise<ParseResult<ChargeNotificationEntry>> {
  const content = await decodeBuffer(buffer);
  const lines = content.split('\n');
  const entries: ChargeNotificationEntry[] = [];
  const header: string[] = [];
  const footer: string[] = [];
  let inDataSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine === '#') {
      if (!inDataSection && trimmedLine && trimmedLine !== '#') {
        header.push(trimmedLine);
      }
      continue;
    }

    if (trimmedLine.includes('#') && !trimmedLine.startsWith('#')) {
      inDataSection = true;
      const parts = trimmedLine.split('#');

      if (parts.length >= 8) {
        const externalId = parts[0].trim();
        const apartmentCode = parts[1].trim();
        const lineNo = parseInt(parts[2].trim(), 10);
        const description = parts[3].trim();
        const quantity = parseFloat(parts[4].trim());
        const unit = parts[5].trim();
        const unitPrice = parseFloat(parts[6].trim());
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
    } else if (inDataSection && !trimmedLine.includes('#')) {
      footer.push(trimmedLine);
    }
  }

  return { header, footer, entries };
}
