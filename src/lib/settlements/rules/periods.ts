import { getPeriodsBetween } from '@/lib/shared/utils/period';

/** "2022-09-30" -> "202209" */
export const isoToPeriod = (date: string) => date.slice(0, 7).replace('-', '');

/** The charge periods ("YYYYMM") of the months from one day to another. */
export const monthsBetween = (from: string, to: string) =>
  getPeriodsBetween(isoToPeriod(from), isoToPeriod(to));

/** A calendar day as it is stored: midnight UTC. */
export const isoToDate = (date: string) => new Date(`${date}T00:00:00.000Z`);

export const dateToIso = (date: Date) => date.toISOString().slice(0, 10);

export const yearOf = (date: string) => Number(date.slice(0, 4));
