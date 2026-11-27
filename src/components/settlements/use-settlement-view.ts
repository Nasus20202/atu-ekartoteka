'use client';

import { usePathname, useSearchParams } from 'next/navigation';

import {
  DEFAULT_SETTLEMENT_VIEW,
  SETTLEMENT_PARAMS,
  type SettlementViewKey,
  toSettlementView,
} from '@/components/settlements/settlement-view-key';

/**
 * The chosen view, kept in the address so that a reload or a shared link opens
 * it again. The page already holds every view, so the address changes through
 * the history API, without asking the server.
 */
export function useSettlementView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = toSettlementView(searchParams.get(SETTLEMENT_PARAMS.view));

  const setView = (next: SettlementViewKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_SETTLEMENT_VIEW) {
      params.delete(SETTLEMENT_PARAMS.view);
    } else {
      params.set(SETTLEMENT_PARAMS.view, next);
    }
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${pathname}?${query}` : pathname
    );
  };

  return { view, setView } as const;
}
