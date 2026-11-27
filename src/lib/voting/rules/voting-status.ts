import { VoteChoice, VotingStatus } from '@/lib/voting/types/voting';

export const VOTING_STATUS_LABELS: Record<VotingStatus, string> = {
  [VotingStatus.DRAFT]: 'Wersja robocza',
  [VotingStatus.ACTIVE]: 'Aktywne',
  [VotingStatus.CLOSED]: 'Zakończone',
  [VotingStatus.ARCHIVED]: 'Zarchiwizowane',
};

export const VOTE_CHOICE_LABELS: Record<VoteChoice, string> = {
  [VoteChoice.FOR]: 'Za',
  [VoteChoice.AGAINST]: 'Przeciw',
  [VoteChoice.ABSTAIN]: 'Wstrzymał(a) się',
};

export const VOTE_CHOICES = [
  VoteChoice.FOR,
  VoteChoice.AGAINST,
  VoteChoice.ABSTAIN,
] as const;

/** The answers a voting accepts. */
export function voteChoices(allowAbstain: boolean): VoteChoice[] {
  return VOTE_CHOICES.filter(
    (choice) => allowAbstain || choice !== VoteChoice.ABSTAIN
  );
}

const TRANSITIONS: Record<VotingStatus, VotingStatus[]> = {
  [VotingStatus.DRAFT]: [VotingStatus.ACTIVE],
  [VotingStatus.ACTIVE]: [VotingStatus.CLOSED, VotingStatus.ARCHIVED],
  [VotingStatus.CLOSED]: [VotingStatus.ARCHIVED],
  [VotingStatus.ARCHIVED]: [],
};

export function isVotingStatus(value: unknown): value is VotingStatus {
  return Object.values(VotingStatus).includes(value as VotingStatus);
}

export function nextVotingStatuses(status: VotingStatus): VotingStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: VotingStatus, to: VotingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Only a draft can change, because ballots exist only after publication. */
export function isEditableStatus(status: VotingStatus): boolean {
  return status === VotingStatus.DRAFT;
}

export function isTenantVisibleStatus(status: VotingStatus): boolean {
  return status === VotingStatus.ACTIVE || status === VotingStatus.CLOSED;
}

export const TENANT_VISIBLE_STATUSES = [
  VotingStatus.ACTIVE,
  VotingStatus.CLOSED,
];

interface OpenWindow {
  status: VotingStatus;
  endsAt: Date | null;
}

/** A ballot is accepted while the voting is active and its deadline has not passed. */
export function isVotingOpen(voting: OpenWindow, now: Date): boolean {
  return (
    voting.status === VotingStatus.ACTIVE &&
    (voting.endsAt === null || voting.endsAt.getTime() > now.getTime())
  );
}
