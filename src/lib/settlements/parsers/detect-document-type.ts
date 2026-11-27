import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type { PdfRow } from '@/lib/settlements/types/pdf';

const SIGNATURES: Record<SettlementDocumentType, RegExp[]> = {
  utility: [/^Usługa:/, /^Okres od Okres do Ilość Cena /],
  annual: [/^Tytułem:/, /^Współczynnik dla lokalu:/],
};

/**
 * Decides the type from the content only: titles differ between communities and
 * may be missing, and file names are chosen by people.
 */
export function detectDocumentType(
  rows: PdfRow[]
): SettlementDocumentType | null {
  const matching = (Object.keys(SIGNATURES) as SettlementDocumentType[]).filter(
    (type) =>
      SIGNATURES[type].every((pattern) =>
        rows.some((row) => pattern.test(row.text))
      )
  );
  return matching.length === 1 ? matching[0] : null;
}
