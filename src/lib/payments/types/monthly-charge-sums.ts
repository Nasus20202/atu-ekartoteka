import type { Decimal } from '@/lib/shared/utils/decimal';

export type ChargeSumsByPeriod = Map<string, Decimal>;
export type MonthlyChargeSums = Map<string, ChargeSumsByPeriod>;
