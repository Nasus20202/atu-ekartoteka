/** Counts and data dates of one homeowners association. */
export interface AssociationStatsDto {
  id: string;
  name: string;
  apartments: number;
  charges: number;
  notifications: number;
  payments: number;
  utilitySettlements: number;
  annualSettlements: number;
  /** First day (UTC) of the newest charge period, null without charges. */
  lastChargePeriod: string | null;
  apartmentsDataDate: string | null;
  chargesDataDate: string | null;
  notificationsDataDate: string | null;
}
