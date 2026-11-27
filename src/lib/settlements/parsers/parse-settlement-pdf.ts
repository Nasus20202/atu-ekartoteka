import { detectDocumentType } from '@/lib/settlements/parsers/detect-document-type';
import { parseAnnualRows } from '@/lib/settlements/parsers/parse-annual-rows';
import { parseUtilityRows } from '@/lib/settlements/parsers/parse-utility-rows';
import { readPdfPages } from '@/lib/settlements/parsers/read-pdf-pages';
import { toRows } from '@/lib/settlements/parsers/to-rows';
import type {
  ParsedDocument,
  ParseProblem,
} from '@/lib/settlements/types/parsed-document';
import type { PdfItem, PdfPage } from '@/lib/settlements/types/pdf';

// The annual template prints a legend in small text next to its rows and large
// decorative brackets around the coefficient
const ANNUAL_LEGEND_HEIGHT = 7.5;
const ANNUAL_BRACKET_HEIGHT = 30;

const isAnnualContent = ({ height }: PdfItem) =>
  height > ANNUAL_LEGEND_HEIGHT && height < ANNUAL_BRACKET_HEIGHT;

const unknown = (problem: ParseProblem): ParsedDocument => ({
  type: null,
  records: [],
  problems: [problem],
});

/** Reads a settlement printout; problems are reported instead of thrown. */
export async function parseSettlementPdf(
  data: Uint8Array
): Promise<ParsedDocument> {
  let pages: PdfPage[];
  try {
    pages = await readPdfPages(data);
  } catch {
    return unknown({
      kind: 'unreadable',
      message: 'Nie można odczytać pliku PDF.',
    });
  }

  const rows = toRows(pages);
  switch (detectDocumentType(rows)) {
    case 'utility':
      return parseUtilityRows(rows);
    case 'annual':
      return parseAnnualRows(toRows(pages, isAnnualContent));
    default:
      return unknown({
        kind: 'unknown-document',
        message:
          'Nierozpoznany dokument: to nie jest rozliczenie mediów ani rozliczenie kosztów rzeczywistych.',
      });
  }
}
