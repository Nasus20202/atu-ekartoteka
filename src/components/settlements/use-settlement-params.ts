'use client';

import { useSearchParamsUpdate } from '@/hooks/use-search-params-update';

/** Puts a selected record, or a choice about the readings, into the address. */
export function useSettlementParams() {
  const { update } = useSearchParamsUpdate();
  const select = (name: string, value: string) => update({ [name]: value });

  return { select, update } as const;
}
