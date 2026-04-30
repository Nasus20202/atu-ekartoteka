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

export function parseDecimal(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

export function parseDecimalValue(value: string): Prisma.Decimal {
  return new Prisma.Decimal(value.replace(',', '.'));
}

export async function decodeBuffer(buffer: Buffer): Promise<string> {
  return iconv.decode(buffer, 'iso-8859-2');
}
