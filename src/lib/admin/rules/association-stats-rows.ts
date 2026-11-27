import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import { isoOrNull, periodToIsoMonth } from '@/lib/admin/rules/stats-dates';

/** An association as read from the database, with the data dates its row shows. */
export interface AssociationRecord {
  id: string;
  name: string;
  apartmentsDataDate: Date | null;
  chargesDataDate: Date | null;
  notificationsDataDate: Date | null;
}

/** Apartment count of one association, from a database group by association. */
export interface AssociationCount {
  homeownersAssociationId: string;
  count: number;
}

/** The association that owns an apartment. */
export interface ApartmentOwner {
  id: string;
  homeownersAssociationId: string;
}

/** A record count of one apartment, from a database group by apartment. */
export interface ApartmentCount {
  apartmentId: string;
  count: number;
}

/** Charge count of one apartment, with the newest "YYYYMM" period of that apartment. */
export interface ApartmentChargeCount extends ApartmentCount {
  lastPeriod: string | null;
}

/**
 * Database groups read for the association rows. Per-apartment groups are
 * attributed to their association through `apartments`, because Prisma
 * cannot group by a field of a related record.
 */
export interface AssociationStatsSource {
  /** Ordered by the query; the rows keep this order. */
  associations: AssociationRecord[];
  apartmentCounts: AssociationCount[];
  apartments: ApartmentOwner[];
  charges: ApartmentChargeCount[];
  notifications: ApartmentCount[];
  payments: ApartmentCount[];
  utilitySettlements: ApartmentCount[];
  annualSettlements: ApartmentCount[];
}

/** Sums per-apartment counts into their association. Apartments without an owner are skipped. */
function sumByAssociation(
  groups: ApartmentCount[],
  owners: Map<string, string>
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const group of groups) {
    const associationId = owners.get(group.apartmentId);
    if (associationId === undefined) continue;
    totals.set(associationId, (totals.get(associationId) ?? 0) + group.count);
  }
  return totals;
}

/** The newest charge period across the apartments of each association. */
function newestPeriodByAssociation(
  charges: ApartmentChargeCount[],
  owners: Map<string, string>
): Map<string, string> {
  const newest = new Map<string, string>();
  for (const charge of charges) {
    const associationId = owners.get(charge.apartmentId);
    if (associationId === undefined || charge.lastPeriod === null) continue;

    const current = newest.get(associationId);
    // "YYYYMM" periods order like the months they name
    if (current === undefined || charge.lastPeriod > current) {
      newest.set(associationId, charge.lastPeriod);
    }
  }
  return newest;
}

/** One statistics row per association, in the order of `source.associations`. */
export function buildAssociationStatsRows(
  source: AssociationStatsSource
): AssociationStatsDto[] {
  const owners = new Map<string, string>(
    source.apartments.map((apartment) => [
      apartment.id,
      apartment.homeownersAssociationId,
    ])
  );
  const apartments = new Map<string, number>(
    source.apartmentCounts.map((group) => [
      group.homeownersAssociationId,
      group.count,
    ])
  );
  const charges = sumByAssociation(source.charges, owners);
  const notifications = sumByAssociation(source.notifications, owners);
  const payments = sumByAssociation(source.payments, owners);
  const utilitySettlements = sumByAssociation(
    source.utilitySettlements,
    owners
  );
  const annualSettlements = sumByAssociation(source.annualSettlements, owners);
  const lastPeriods = newestPeriodByAssociation(source.charges, owners);

  return source.associations.map((association) => {
    const { id } = association;
    return {
      id,
      name: association.name,
      apartments: apartments.get(id) ?? 0,
      charges: charges.get(id) ?? 0,
      notifications: notifications.get(id) ?? 0,
      payments: payments.get(id) ?? 0,
      utilitySettlements: utilitySettlements.get(id) ?? 0,
      annualSettlements: annualSettlements.get(id) ?? 0,
      lastChargePeriod: periodToIsoMonth(lastPeriods.get(id) ?? null),
      apartmentsDataDate: isoOrNull(association.apartmentsDataDate),
      chargesDataDate: isoOrNull(association.chargesDataDate),
      notificationsDataDate: isoOrNull(association.notificationsDataDate),
    };
  });
}
