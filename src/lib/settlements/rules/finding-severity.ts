import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';

// Without these a record cannot be read, assigned to an apartment or stored
const ALWAYS_BLOCKING: ReadonlySet<SettlementIssue['kind']> = new Set([
  'unreadable',
  'unknown-document',
  'unrecognised',
  'match',
  'duplicate',
  'unstorable',
]);

/** The findings of an import without validation: its checks only warn. */
export const relaxIssues = (issues: SettlementIssue[]): SettlementIssue[] =>
  issues.map((issue) =>
    ALWAYS_BLOCKING.has(issue.kind) ? issue : { ...issue, severity: 'warning' }
  );
