import type { AnnualBlockBuilder } from '@/lib/settlements/parsers/annual-block-builder';
import {
  RecipientHeader,
  startBlock,
} from '@/lib/settlements/parsers/annual-client';
import { ANNUAL_PATTERNS } from '@/lib/settlements/parsers/annual-patterns';
import { assembleAnnualRecords } from '@/lib/settlements/parsers/assemble-annual-records';
import { signedResult } from '@/lib/settlements/parsers/parse-values';
import type {
  AnnualOwnerTotal,
  ParsedAnnualRecord,
} from '@/lib/settlements/types/annual-settlement';
import type {
  AnnualDocument,
  ParseProblem,
} from '@/lib/settlements/types/parsed-document';
import type { PdfRow } from '@/lib/settlements/types/pdf';
import { sumDecimals } from '@/lib/shared/utils/sum';

// Rows that carry values; outside a record they would be silently lost
const CONTENT_OUTSIDE_RECORD = [
  ANNUAL_PATTERNS.title,
  ANNUAL_PATTERNS.communityAmount,
  ANNUAL_PATTERNS.itemResult,
  ANNUAL_PATTERNS.apartmentTotal,
  ANNUAL_PATTERNS.ownerTotal,
];

const unrecognised = (row: PdfRow, reason: string): ParseProblem => ({
  kind: 'unrecognised',
  page: row.page,
  message: `${reason}: „${row.text}”`,
});

/**
 * Reads annual cost settlement rows. An owner's part starts at the apartment
 * row below the recipient and ends at the owner total; it can hold several
 * apartments and continue on following pages.
 */
export function parseAnnualRows(rows: PdfRow[]): AnnualDocument {
  const records: ParsedAnnualRecord[] = [];
  const ownerTotals: AnnualOwnerTotal[] = [];
  const problems: ParseProblem[] = [];
  let header = new RecipientHeader();
  let block: AnnualBlockBuilder | null = null;
  // Set from the first apartment row until the owner total
  let owner: ReturnType<RecipientHeader['read']> = null;
  let apartmentTotals: ParsedAnnualRecord[] = [];

  for (const row of rows) {
    const apartment = ANNUAL_PATTERNS.apartment.exec(row.text)?.[1];

    if (block) {
      const total = ANNUAL_PATTERNS.apartmentTotal.exec(row.text);
      if (total) {
        const record = block.finish(total[1], total[2], row.page);
        if (record) apartmentTotals.push(record);
        else problems.push(unrecognised(row, 'Niepełne rozliczenie przed'));
        block = null;
      } else if (!block.add(row.text, row.page)) {
        problems.push(unrecognised(row, 'Nierozpoznany wiersz'));
      }
      continue;
    }

    if (apartment) {
      owner ??= header.read();
      block = owner && startBlock(apartment, owner);
      if (!block) {
        problems.push(
          unrecognised(row, 'Nie można odczytać lokalu lub właściciela')
        );
      }
      continue;
    }

    if (owner) {
      const total = ANNUAL_PATTERNS.ownerTotal.exec(row.text);
      if (!total) {
        problems.push(unrecognised(row, 'Nierozpoznany wiersz'));
        continue;
      }
      ownerTotals.push({
        page: row.page,
        printedOwner: owner.printedOwner,
        total: signedResult(total[1], total[2]),
        apartmentSum: sumDecimals(apartmentTotals.map((r) => r.totalAmount)),
      });
      records.push(...apartmentTotals);
      apartmentTotals = [];
      owner = null;
      header = new RecipientHeader();
    } else if (CONTENT_OUTSIDE_RECORD.some((p) => p.test(row.text))) {
      problems.push(unrecognised(row, 'Pozycja poza rozliczeniem'));
    } else {
      header.add(row);
    }
  }

  const last = rows.at(-1);
  if ((block || owner) && last) {
    problems.push(unrecognised(last, 'Brak sumy rozliczenia po'));
  }

  return {
    type: 'annual',
    records: assembleAnnualRecords([...records, ...apartmentTotals]),
    ownerTotals,
    problems,
  };
}
