import { AnnualBlockBuilder } from '@/lib/settlements/parsers/annual-block-builder';
import { ANNUAL_PATTERNS } from '@/lib/settlements/parsers/annual-patterns';
import { parsePrintedDate } from '@/lib/settlements/parsers/parse-values';
import type { PdfRow } from '@/lib/settlements/types/pdf';

// Horizontal position of the recipient's name and mailing address
const RECIPIENT_COLUMN = { from: 140, to: 160 };
// The name, then one address line
const RECIPIENT_ROWS = 2;

/** The page header of one owner: issue date and recipient. */
export class RecipientHeader {
  private issuedOn: string | null = null;
  private recipient: string[] = [];

  add(row: PdfRow): void {
    const issued = ANNUAL_PATTERNS.issuedOn.exec(row.text)?.[1];
    if (issued) {
      this.issuedOn = parsePrintedDate(issued);
      this.recipient = [];
    } else if (row.x >= RECIPIENT_COLUMN.from && row.x <= RECIPIENT_COLUMN.to) {
      this.recipient.push(row.text);
    }
  }

  /** Owner name and issue date, or null when the header cannot be read. */
  read(): { printedOwner: string; issuedOn: string } | null {
    return this.issuedOn && this.recipient.length === RECIPIENT_ROWS
      ? { printedOwner: this.recipient[0], issuedOn: this.issuedOn }
      : null;
  }
}

/** Starts the block of an apartment row, or null when the row cannot be read. */
export function startBlock(
  apartmentLabel: string,
  owner: { printedOwner: string; issuedOn: string }
): AnnualBlockBuilder | null {
  const address = ANNUAL_PATTERNS.address.exec(apartmentLabel);
  if (!address) return null;
  const [, street, building, number] = address;
  return new AnnualBlockBuilder({
    ...owner,
    apartmentLabel,
    address: { street, building, number },
  });
}
