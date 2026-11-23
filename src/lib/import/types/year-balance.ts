export type YearStatus = 'ok' | 'warning' | 'error';

export interface YearRecord {
  apartmentLabel: string;
  ownerId: string;
  opening: string;
  closing: string;
  nextOpening: string | null;
  difference: string | null;
  status: 'match' | 'mismatch' | 'ended' | 'last';
  isNew: boolean;
}

export interface YearBalanceRow {
  year: number;
  openingBalance: string;
  calculatedClosing: string;
  closingMismatch: boolean;
  issueCount: number;
  status: YearStatus;
  records: YearRecord[];
  newRecordsOpening: string;
}
