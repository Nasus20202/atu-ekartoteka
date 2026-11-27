/** Which settlements a reader may see; the caller decides who that is. */
export interface SettlementScope {
  apartmentId: string;
  apartment?: { userId: string };
  periodTo?: { gte: Date };
}
