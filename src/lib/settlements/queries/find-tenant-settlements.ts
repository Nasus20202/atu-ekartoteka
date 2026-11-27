import {
  loadApartmentSettlements,
  type SettlementSelection,
} from '@/lib/settlements/queries/load-apartment-settlements';

const withoutOrigin = <T extends { origin: unknown }>(record: T | null) =>
  record && { ...record, origin: null };

/**
 * Settlements of the user's own apartment whose period ends inside the history
 * window, without the details of the imported documents.
 */
export async function findTenantSettlements(
  userId: string,
  apartmentId: string,
  startYear: number,
  selection: SettlementSelection
) {
  const data = await loadApartmentSettlements(
    {
      apartmentId,
      apartment: { userId },
      periodTo: { gte: new Date(Date.UTC(startYear, 0, 1)) },
    },
    selection
  );
  return (
    data && {
      ...data,
      utility: withoutOrigin(data.utility),
      annual: withoutOrigin(data.annual),
    }
  );
}
