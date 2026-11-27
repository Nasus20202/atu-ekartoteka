import { describe, expect, it } from 'vitest';

import type { RejectionReason } from '@/lib/platform/opentelemetry/voting-metrics';
import {
  linkRejectionMetric,
  type VoteLinkRejection,
} from '@/lib/voting/use-cases/resolve-vote-link';

const FAILURE = { ok: false as const, code: 'invalid' as const, message: 'x' };

describe('linkRejectionMetric', () => {
  const CASES: [VoteLinkRejection, RejectionReason | null][] = [
    [{ reason: 'invalid-link' }, 'invalid_link'],
    [{ reason: 'foreign-link', ownerId: 'user-2' }, 'foreign_link'],
    [{ reason: 'expired', confirmationId: 'c1' }, 'expired'],
    [{ reason: 'unreadable-answers', confirmationId: 'c1' }, 'invalid_link'],
    [{ reason: 'not-found', failure: FAILURE }, 'closed'],
    [{ reason: 'closed', failure: FAILURE }, 'closed'],
    [{ reason: 'no-access', failure: FAILURE }, null],
  ];

  it.each(CASES)('counts %j as %s', (rejection, expected) => {
    expect(linkRejectionMetric(rejection)).toBe(expected);
  });
});
