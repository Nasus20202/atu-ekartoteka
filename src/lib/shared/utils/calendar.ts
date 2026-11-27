import { toLocalIsoDate } from '@/lib/shared/utils/local-date';

const DAYS_IN_WEEK = 7;
// Six weeks hold every month, so the calendar keeps its height
const WEEKS_SHOWN = 6;
const MONDAY = 1;

export const WEEKDAYS = [
  { short: 'pn', long: 'poniedziałek' },
  { short: 'wt', long: 'wtorek' },
  { short: 'śr', long: 'środa' },
  { short: 'cz', long: 'czwartek' },
  { short: 'pt', long: 'piątek' },
  { short: 'sb', long: 'sobota' },
  { short: 'nd', long: 'niedziela' },
];

const MONTH_FORMAT = new Intl.DateTimeFormat('pl-PL', {
  month: 'long',
  year: 'numeric',
});
const DAY_FORMAT = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** A local date from "YYYY-MM-DD". */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

/** The same day of another month, or its last day when the month is shorter. */
export function addMonths(iso: string, months: number): string {
  const date = parseIsoDate(iso);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return toLocalIsoDate(target);
}

/** The weeks, Monday first, of the month that contains the date. */
export function monthWeeks(iso: string): string[][] {
  const first = parseIsoDate(iso);
  first.setDate(1);
  const lead = (first.getDay() - MONDAY + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  const start = addDays(toLocalIsoDate(first), -lead);

  return Array.from({ length: WEEKS_SHOWN }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, day) =>
      addDays(start, week * DAYS_IN_WEEK + day)
    )
  );
}

/** "listopad 2026" */
export const formatMonth = (iso: string) =>
  MONTH_FORMAT.format(parseIsoDate(iso));

/** "27 listopada 2026" */
export const formatLongDay = (iso: string) =>
  DAY_FORMAT.format(parseIsoDate(iso));
