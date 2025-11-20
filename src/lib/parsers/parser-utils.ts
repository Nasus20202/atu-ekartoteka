import { decode } from 'iconv-lite';

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

export async function decodeBuffer(buffer: Buffer): Promise<string> {
  return decode(buffer, 'iso-8859-2');
}
