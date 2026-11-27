import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';

/** Totals of one data type. Dates are ISO strings, null when the type has none. */
export interface DataTypeStatsDto {
  count: number;
  rangeFrom: string | null;
  rangeTo: string | null;
  lastChangedAt: string | null;
}

export interface ApartmentStatsDto extends DataTypeStatsDto {
  active: number;
}

export interface DatabaseStatsDto {
  hoa: DataTypeStatsDto;
  apartments: ApartmentStatsDto;
  users: DataTypeStatsDto;
  charges: DataTypeStatsDto;
  notifications: DataTypeStatsDto;
  payments: DataTypeStatsDto;
  utilitySettlements: DataTypeStatsDto;
  meterReadings: DataTypeStatsDto;
  annualSettlements: DataTypeStatsDto;
}

/**
 * Response of `GET /api/admin/stats`. `associations` is present only when the
 * request carries the associations query parameter.
 */
export interface AdminStatsDto extends DatabaseStatsDto {
  associations?: AssociationStatsDto[];
}
