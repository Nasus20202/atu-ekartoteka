import type {
  DatabaseStatsDto,
  DataTypeStatsDto,
} from '@/lib/admin/dto/database-stats-dto';
import { isoOrNull, periodToIsoMonth } from '@/lib/admin/rules/stats-dates';
import { prisma } from '@/lib/platform/database/prisma';

/**
 * Totals, date ranges and last changes of every data type. The charge figures
 * come from index lookups, not a full aggregate of the charge table.
 *
 * Nine queries run together and then the four charge queries, so at most ten
 * are in flight at once, the size of the connection pool.
 */
export async function getDashboardStats(): Promise<DatabaseStatsDto> {
  const [
    hoa,
    apartments,
    activeApartments,
    users,
    notifications,
    payments,
    utilitySettlements,
    meterReadings,
    annualSettlements,
  ] = await Promise.all([
    prisma.homeownersAssociation.aggregate({
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    prisma.apartment.aggregate({
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    prisma.apartment.count({ where: { isActive: true } }),
    prisma.user.aggregate({
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    prisma.chargeNotification.aggregate({
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    prisma.payment.aggregate({
      _count: { _all: true },
      _min: { dateFrom: true },
      _max: { dateTo: true, updatedAt: true },
    }),
    prisma.utilitySettlement.aggregate({
      _count: { _all: true },
      _min: { periodFrom: true },
      _max: { periodTo: true, updatedAt: true },
    }),
    prisma.meterReading.aggregate({
      _count: { _all: true },
      _min: { startDate: true },
      _max: { endDate: true },
    }),
    prisma.annualCostSettlement.aggregate({
      _count: { _all: true },
      _min: { periodFrom: true },
      _max: { periodTo: true, updatedAt: true },
    }),
  ]);
  const charges = await getChargeStats();

  return {
    hoa: {
      count: hoa._count._all,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: isoOrNull(hoa._max.updatedAt),
    },
    apartments: {
      count: apartments._count._all,
      active: activeApartments,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: isoOrNull(apartments._max.updatedAt),
    },
    users: {
      count: users._count._all,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: isoOrNull(users._max.updatedAt),
    },
    charges,
    notifications: {
      count: notifications._count._all,
      rangeFrom: null,
      rangeTo: null,
      lastChangedAt: isoOrNull(notifications._max.updatedAt),
    },
    payments: {
      count: payments._count._all,
      rangeFrom: isoOrNull(payments._min.dateFrom),
      rangeTo: isoOrNull(payments._max.dateTo),
      lastChangedAt: isoOrNull(payments._max.updatedAt),
    },
    utilitySettlements: {
      count: utilitySettlements._count._all,
      rangeFrom: isoOrNull(utilitySettlements._min.periodFrom),
      rangeTo: isoOrNull(utilitySettlements._max.periodTo),
      lastChangedAt: isoOrNull(utilitySettlements._max.updatedAt),
    },
    meterReadings: {
      count: meterReadings._count._all,
      rangeFrom: isoOrNull(meterReadings._min.startDate),
      rangeTo: isoOrNull(meterReadings._max.endDate),
      lastChangedAt: null,
    },
    annualSettlements: {
      count: annualSettlements._count._all,
      rangeFrom: isoOrNull(annualSettlements._min.periodFrom),
      rangeTo: isoOrNull(annualSettlements._max.periodTo),
      lastChangedAt: isoOrNull(annualSettlements._max.updatedAt),
    },
  };
}

/** Charge count, first and last period, and newest change, from indexed lookups. */
async function getChargeStats(): Promise<DataTypeStatsDto> {
  const [count, oldest, newest, latestChange] = await Promise.all([
    prisma.charge.count(),
    prisma.charge.findFirst({
      orderBy: { period: 'asc' },
      select: { period: true },
    }),
    prisma.charge.findFirst({
      orderBy: { period: 'desc' },
      select: { period: true },
    }),
    prisma.charge.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ]);

  return {
    count,
    rangeFrom: periodToIsoMonth(oldest?.period ?? null),
    rangeTo: periodToIsoMonth(newest?.period ?? null),
    lastChangedAt: isoOrNull(latestChange?.updatedAt ?? null),
  };
}
