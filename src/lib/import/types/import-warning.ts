export type ImportWarningKind =
  | 'line-total'
  | 'charges-mismatch'
  | 'opening-balance-file'
  | 'opening-balance-calculated'
  | 'skipped-records';

export interface ImportWarning {
  kind: ImportWarningKind;
  apartmentExternalId: string;
  period?: string;
  year?: number;
  lineNo?: number;
  difference?: string;
  // Charges mismatch only: differing months and how many of them the settlement lines explain
  months?: { differing: number; explainedBySettlement: number };
  message: string;
}
