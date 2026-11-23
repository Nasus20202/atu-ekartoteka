export type ImportErrorKind =
  | 'duplicate-records'
  | 'balance-mismatch'
  | 'database'
  | 'transaction'
  | 'missing-files'
  | 'file-error';

export interface ImportErrorItem {
  kind: ImportErrorKind;
  message: string;
  // Year the error belongs to; undefined when it applies to the whole HOA
  year?: number;
}

// Error about a whole batch: a file that could not be read or an HOA that could not be imported
export interface ImportError extends ImportErrorItem {
  hoaId?: string;
  file?: string;
}
