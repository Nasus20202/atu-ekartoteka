import { isSortDirection, type SortState } from '@/lib/shared/utils/sort';
import { isVotingStatus } from '@/lib/voting/rules/voting-status';
import type { VotingStatus } from '@/lib/voting/types/voting';

export const VOTING_SORT_LABELS = {
  title: 'Tytuł',
  hoa: 'Wspólnota',
  status: 'Stan',
  questions: 'Pytania',
  ballots: 'Oddane głosy',
  endsAt: 'Termin',
  createdAt: 'Utworzono',
} as const;

export type VotingSortKey = keyof typeof VOTING_SORT_LABELS;

export const VOTING_LIST_PARAMS = {
  hoa: 'hoa',
  status: 'status',
  sort: 'sort',
  order: 'order',
} as const;

/** How the admin's list of votings is narrowed and ordered. */
export interface VotingListQuery {
  hoaId: string | null;
  status: VotingStatus | null;
  sort: SortState<VotingSortKey>;
}

export const DEFAULT_VOTING_SORT: SortState<VotingSortKey> = {
  key: 'createdAt',
  direction: 'desc',
};

export const ALL_VOTINGS: VotingListQuery = {
  hoaId: null,
  status: null,
  sort: DEFAULT_VOTING_SORT,
};

export type VotingListSearchParams = Record<
  string,
  string | string[] | undefined
>;

const isSortKey = (value: string): value is VotingSortKey =>
  Object.hasOwn(VOTING_SORT_LABELS, value);

/** Reads the address; anything unknown or repeated is ignored. */
export function toVotingListQuery(
  params: VotingListSearchParams
): VotingListQuery {
  const read = (name: string) => {
    const value = params[name];
    return typeof value === 'string' ? value : '';
  };
  const status = read(VOTING_LIST_PARAMS.status);
  const key = read(VOTING_LIST_PARAMS.sort);
  const direction = read(VOTING_LIST_PARAMS.order);

  return {
    hoaId: read(VOTING_LIST_PARAMS.hoa) || null,
    status: isVotingStatus(status) ? status : null,
    sort:
      isSortKey(key) && isSortDirection(direction)
        ? { key, direction }
        : DEFAULT_VOTING_SORT,
  };
}
