import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

import { formatCurrency } from '@/lib/utils';

const compactAmountFormatter = new Intl.NumberFormat('pl-PL', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCompactAmount(value: number): string {
  return compactAmountFormatter.format(value);
}

export function formatTooltipAmount(
  value: ValueType | undefined,
  name: NameType | undefined
): [string, string] {
  return [formatCurrency(Number(value)), String(name)];
}

export function formatSeriesTooltipAmount(
  value: ValueType | undefined,
  _name: NameType | undefined,
  item: { name?: NameType }
): [string, string] {
  return formatTooltipAmount(value, item.name);
}

export function formatTooltipLabel(value: unknown): string {
  return String(value);
}
