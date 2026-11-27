import { describe, expect, it } from 'vitest';

import {
  canTransition,
  isEditableStatus,
  isTenantVisibleStatus,
  isVotingOpen,
  nextVotingStatuses,
  VOTING_STATUS_LABELS,
} from '@/lib/voting/rules/voting-status';
import { VotingStatus } from '@/lib/voting/types/voting';

describe('voting status', () => {
  it('labels every status in Polish', () => {
    expect(VOTING_STATUS_LABELS).toEqual({
      DRAFT: 'Wersja robocza',
      ACTIVE: 'Aktywne',
      RESULTS_PUBLISHED: 'Pokaż wyniki',
      ARCHIVED: 'Zarchiwizowane',
    });
  });

  it('allows only the forward transitions', () => {
    expect(nextVotingStatuses(VotingStatus.DRAFT)).toEqual(['ACTIVE']);
    expect(canTransition(VotingStatus.ACTIVE, VotingStatus.ARCHIVED)).toBe(
      true
    );
    expect(canTransition(VotingStatus.ARCHIVED, VotingStatus.ACTIVE)).toBe(
      false
    );
    expect(canTransition(VotingStatus.DRAFT, VotingStatus.ARCHIVED)).toBe(
      false
    );
    expect(canTransition(VotingStatus.ACTIVE, VotingStatus.DRAFT)).toBe(false);
  });

  it('edits only drafts and shows tenants only active and published votings', () => {
    expect(isEditableStatus(VotingStatus.DRAFT)).toBe(true);
    expect(isEditableStatus(VotingStatus.ACTIVE)).toBe(false);
    expect(isTenantVisibleStatus(VotingStatus.ACTIVE)).toBe(true);
    expect(isTenantVisibleStatus(VotingStatus.RESULTS_PUBLISHED)).toBe(true);
    expect(isTenantVisibleStatus(VotingStatus.DRAFT)).toBe(false);
    expect(isTenantVisibleStatus(VotingStatus.ARCHIVED)).toBe(false);
  });

  describe('isVotingOpen', () => {
    const now = new Date('2026-06-01T12:00:00Z');

    it('is open while active without a deadline or before it', () => {
      expect(
        isVotingOpen({ status: VotingStatus.ACTIVE, endsAt: null }, now)
      ).toBe(true);
      expect(
        isVotingOpen(
          {
            status: VotingStatus.ACTIVE,
            endsAt: new Date('2026-06-02T00:00:00Z'),
          },
          now
        )
      ).toBe(true);
    });

    it('is closed at or after the deadline and in any other status', () => {
      expect(
        isVotingOpen({ status: VotingStatus.ACTIVE, endsAt: now }, now)
      ).toBe(false);
      expect(
        isVotingOpen(
          {
            status: VotingStatus.ACTIVE,
            endsAt: new Date('2026-05-01T00:00:00Z'),
          },
          now
        )
      ).toBe(false);
      expect(
        isVotingOpen({ status: VotingStatus.DRAFT, endsAt: null }, now)
      ).toBe(false);
      expect(
        isVotingOpen(
          { status: VotingStatus.RESULTS_PUBLISHED, endsAt: null },
          now
        )
      ).toBe(false);
    });
  });
});
