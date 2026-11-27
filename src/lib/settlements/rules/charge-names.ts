import { comparableText } from '@/lib/settlements/rules/normalize-text';

const DECEMBER = '12';
const SETTLEMENT_BASIS = /^wyrównanie zalicz\p{L}* /u;

/** The yearly allocation is booked in December with a unit price of 1. */
export const isAllocationShaped = (charge: {
  period: string;
  unitPrice: { equals: (value: number) => boolean };
}) => charge.period.endsWith(DECEMBER) && charge.unitPrice.equals(1);

export const allocationPeriod = (periodTo: string) =>
  `${periodTo.slice(0, 4)}${DECEMBER}`;

/**
 * The charge names that make up an annual basis: its own, and for a settlement
 * of advances also the advance, e.g. "Zaliczka CW".
 */
export function basisChargeNames(basis: string): Set<string> {
  const name = comparableText(basis);
  return new Set([name, name.replace(SETTLEMENT_BASIS, 'zaliczka ')]);
}
