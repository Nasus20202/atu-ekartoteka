import { describe, expect, it } from 'vitest';

import { relaxIssues } from '@/lib/settlements/rules/finding-severity';
import type {
  SettlementIssue,
  SettlementIssueKind,
} from '@/lib/settlements/types/settlement-issue';

const issue = (kind: SettlementIssueKind): SettlementIssue => ({
  kind,
  severity: 'error',
  fileName: 'a.pdf',
  message: kind,
});

describe('relaxIssues', () => {
  it.each<SettlementIssueKind>([
    'inconsistent',
    'charges',
    'overlap',
    'not-verified',
  ])('turns an error of kind %s into a warning', (kind) => {
    expect(relaxIssues([issue(kind)])).toEqual([
      { ...issue(kind), severity: 'warning' },
    ]);
  });

  it.each<SettlementIssueKind>([
    'unreadable',
    'unknown-document',
    'unrecognised',
    'match',
    'duplicate',
    'unstorable',
  ])('keeps an error of kind %s', (kind) => {
    expect(relaxIssues([issue(kind)])).toEqual([issue(kind)]);
  });
});
