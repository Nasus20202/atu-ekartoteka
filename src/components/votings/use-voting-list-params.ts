'use client';

import { useSearchParamsUpdate } from '@/hooks/use-search-params-update';
import type { SortState } from '@/lib/shared/utils/sort';
import {
  VOTING_LIST_PARAMS,
  type VotingSortKey,
} from '@/lib/voting/rules/voting-list-query';

/** Puts the filters and the order of the list into the address. */
export function useVotingListParams() {
  const { update } = useSearchParamsUpdate();

  return {
    setHoa: (hoaId: string) => update({ [VOTING_LIST_PARAMS.hoa]: hoaId }),
    setStatus: (status: string) =>
      update({ [VOTING_LIST_PARAMS.status]: status }),
    setSort: ({ key, direction }: SortState<VotingSortKey>) =>
      update({
        [VOTING_LIST_PARAMS.sort]: key,
        [VOTING_LIST_PARAMS.order]: direction,
      }),
    clearFilters: () =>
      update({
        [VOTING_LIST_PARAMS.hoa]: null,
        [VOTING_LIST_PARAMS.status]: null,
      }),
  } as const;
}
