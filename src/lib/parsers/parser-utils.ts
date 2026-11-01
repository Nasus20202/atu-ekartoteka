import iconv from 'iconv-lite';

import { Prisma } from '@/generated/prisma/client';

export interface ParseResult<T> {
  entries: T[];
  header?: string[];
  footer?: string[];
}

export function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map((x) => parseInt(x, 10));
  return new Date(year, month - 1, day);
}

export function parseDecimalValue(value: string): Prisma.Decimal {
  return new Prisma.Decimal(value.replace(',', '.'));
}

export async function decodeBuffer(buffer: Buffer): Promise<string> {
  return iconv.decode(buffer, 'iso-8859-2');
}

const YYYYMMDD_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;

/** Parses a YYYYMMDD string into a midnight UTC Date. Returns null unless it is a real calendar date. */
export function parseYyyymmdd(value: string): Date | null {
  const match = YYYYMMDD_PATTERN.exec(value.trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isRealDate ? date : null;
}
