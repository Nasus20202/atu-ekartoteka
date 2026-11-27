// Polish wording of settlement results. Amounts are positive when to pay.

import { type DecimalLike, toDecimal } from '@/lib/shared/utils/decimal';

export type ResultKind = 'overpaid' | 'due' | 'even';

export function resultKind(amount: DecimalLike): ResultKind {
  const value = toDecimal(amount);
  if (value.isZero()) return 'even';
  return value.isNegative() ? 'overpaid' : 'due';
}

export const RESULT_LABELS: Record<ResultKind, string> = {
  overpaid: 'nadpłata',
  due: 'niedopłata',
  even: 'bez różnicy',
};

const UTILITY_TITLES: Record<ResultKind, string> = {
  overpaid: 'Nadpłata za media',
  due: 'Niedopłata za media',
  even: 'Rozliczenie mediów',
};

export const utilityResultTitle = (amount: DecimalLike) =>
  UTILITY_TITLES[resultKind(amount)];

export function annualResultTitle(amount: DecimalLike, periodTo: string) {
  const year = periodTo.slice(0, 4);
  const kind = resultKind(amount);
  return kind === 'even'
    ? `Suma za ${year} rok`
    : `Suma: ${RESULT_LABELS[kind]} za ${year} rok`;
}

export const utilityHeading = (name: string, code: string) =>
  name === code ? code : `${name} (${code})`;

export const COMMUNITY_AMOUNT_NOTE =
  'Kwota wspólnoty: wartość dodatnia oznacza niedopłatę, ujemna nadpłatę.';

export const CONSUMPTION_SUFFIX = ' (zużycie)';

const PERCENT = 100;
const NEARLY_ALL = 99;

export interface Usage {
  /** Widths of the bar in percent: used advance and excess over it */
  used: number;
  excess: number;
  label: string;
}

/** Consumption against the advance, or null when there is no advance. */
export function describeUsage(
  consumption: DecimalLike,
  advance: DecimalLike
): Usage | null {
  const used = toDecimal(consumption);
  const paid = toDecimal(advance);
  if (!paid.greaterThan(0) || used.isNegative()) return null;

  if (used.lessThanOrEqualTo(paid)) {
    const exact = Math.round(used.dividedBy(paid).times(PERCENT).toNumber());
    // Rounding must not claim that the whole advance was used
    const percent = used.equals(paid) ? exact : Math.min(exact, NEARLY_ALL);
    return {
      used: percent,
      excess: 0,
      label: `Wykorzystano ${percent} procent zaliczki`,
    };
  }

  const over = used.minus(paid).dividedBy(paid).times(PERCENT).toNumber();
  const covered = Math.round(paid.dividedBy(used).times(PERCENT).toNumber());
  return {
    used: covered,
    excess: PERCENT - covered,
    label: `Zużycie przekroczyło zaliczkę o ${Math.max(1, Math.round(over))} procent`,
  };
}
