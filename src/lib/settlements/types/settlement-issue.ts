export type SettlementIssueKind =
  | 'unreadable'
  | 'unknown-document'
  | 'unrecognised'
  | 'duplicate'
  | 'match'
  | 'inconsistent'
  | 'unstorable'
  | 'aborted'
  | 'rounding'
  | 'meter-billed'
  | 'ungrouped'
  | 'charges'
  | 'not-verified'
  | 'community'
  | 'overlap'
  | 'continuity'
  | 'serial'
  | 'owner-period'
  | 'confirmation'
  | 'database';

export type SettlementIssueSeverity = 'error' | 'warning';

export interface SettlementIssue {
  kind: SettlementIssueKind;
  severity: SettlementIssueSeverity;
  fileName: string;
  page?: number;
  apartmentExternalId?: string;
  message: string;
}
