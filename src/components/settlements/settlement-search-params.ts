import { SETTLEMENT_PARAMS } from '@/components/settlements/settlement-view-key';
import type { SettlementSelection } from '@/lib/settlements/queries/load-apartment-settlements';
import { toReadingsQuery } from '@/lib/settlements/rules/readings-query';

export type SettlementSearchParams = Record<
  string,
  string | string[] | undefined
>;

/** One non-empty value of a query parameter; repeated parameters are ignored. */
export function readParam(params: SettlementSearchParams, name: string) {
  const value = params[name];
  return typeof value === 'string' && value ? value : undefined;
}

export const readSelection = (
  params: SettlementSearchParams
): SettlementSelection => ({
  utilityId: readParam(params, SETTLEMENT_PARAMS.utility),
  annualId: readParam(params, SETTLEMENT_PARAMS.annual),
  readings: toReadingsQuery(
    readParam(params, SETTLEMENT_PARAMS.meter),
    readParam(params, SETTLEMENT_PARAMS.readingSort),
    readParam(params, SETTLEMENT_PARAMS.readingOrder)
  ),
});
