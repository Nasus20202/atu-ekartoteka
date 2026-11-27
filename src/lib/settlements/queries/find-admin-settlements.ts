import {
  loadApartmentSettlements,
  type SettlementSelection,
} from '@/lib/settlements/queries/load-apartment-settlements';

/**
 * Every settlement of one apartment record. Only for callers that have already
 * required admin access.
 */
export function findAdminSettlements(
  apartmentId: string,
  selection: SettlementSelection
) {
  return loadApartmentSettlements({ apartmentId }, selection);
}
