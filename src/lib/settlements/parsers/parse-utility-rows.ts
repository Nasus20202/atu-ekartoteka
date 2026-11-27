import { assembleUtilityRecords } from '@/lib/settlements/parsers/assemble-utility-records';
import { parsePrintedDate } from '@/lib/settlements/parsers/parse-values';
import { UTILITY_PATTERNS } from '@/lib/settlements/parsers/utility-patterns';
import { UtilityRecordBuilder } from '@/lib/settlements/parsers/utility-record-builder';
import type {
  ParseProblem,
  UtilityDocument,
} from '@/lib/settlements/types/parsed-document';
import type { PdfRow } from '@/lib/settlements/types/pdf';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';

// Rows that carry values; outside a record they would be silently lost
const CONTENT_OUTSIDE_RECORD = [
  UTILITY_PATTERNS.apartment,
  UTILITY_PATTERNS.service,
  UTILITY_PATTERNS.line,
  UTILITY_PATTERNS.meter,
  UTILITY_PATTERNS.summary,
  UTILITY_PATTERNS.total,
];

const unrecognised = (row: PdfRow, reason: string): ParseProblem => ({
  kind: 'unrecognised',
  page: row.page,
  message: `${reason}: „${row.text}”`,
});

/**
 * Reads utility settlement rows. A record starts at the owner and ends at the
 * apartment total; the community header and the footer notes around it differ
 * between communities and are ignored.
 */
export function parseUtilityRows(rows: PdfRow[]): UtilityDocument {
  const parts: ParsedUtilityRecord[] = [];
  const problems: ParseProblem[] = [];
  let issuedOn: string | null = null;
  let builder: UtilityRecordBuilder | null = null;
  let lastRow: PdfRow | undefined;

  for (const row of rows) {
    lastRow = row;
    const owner = UTILITY_PATTERNS.owner.exec(row.text)?.[1];

    if (builder) {
      const total = UTILITY_PATTERNS.total.exec(row.text);
      if (total) {
        const record = builder.finish(total[1], total[2], row.page);
        if (record) parts.push(record);
        else problems.push(unrecognised(row, 'Niepełne rozliczenie przed'));
        builder = null;
        issuedOn = null;
      } else if (owner !== undefined || !builder.add(row.text)) {
        problems.push(unrecognised(row, 'Nierozpoznany wiersz'));
      }
      continue;
    }

    const issued = UTILITY_PATTERNS.issuedOn.exec(row.text)?.[1];
    if (issued) {
      issuedOn = parsePrintedDate(issued);
    } else if (owner !== undefined) {
      if (!owner || !issuedOn) {
        problems.push(
          unrecognised(row, 'Brak właściciela lub daty wystawienia')
        );
      }
      builder = new UtilityRecordBuilder(owner, issuedOn ?? '');
    } else if (CONTENT_OUTSIDE_RECORD.some((p) => p.test(row.text))) {
      problems.push(unrecognised(row, 'Pozycja poza rozliczeniem'));
    }
  }

  if (builder && lastRow) {
    problems.push(unrecognised(lastRow, 'Brak sumy rozliczenia po'));
  }

  return { type: 'utility', records: assembleUtilityRecords(parts), problems };
}
