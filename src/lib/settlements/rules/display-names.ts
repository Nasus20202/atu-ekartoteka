import { comparableText } from '@/lib/settlements/rules/normalize-text';

const UTILITY_NAMES: Record<string, string> = {
  CW: 'Ciepła woda',
  ZW: 'Zimna woda',
  CO: 'Ogrzewanie',
};

// Short names of annual items, found by the basis their coefficient comes from
const ANNUAL_NAMES: Array<[RegExp, string]> = [
  [/^wyrównanie zalicz\p{L}* cw$/u, 'Ciepła woda'],
  [/^wyrównanie zalicz\p{L}* zw$/u, 'Zimna woda'],
  [/^wyrównanie zalicz\p{L}* co(?!\p{L})/u, 'Ogrzewanie, opłata zmienna'],
  [/^co opłata stała$/u, 'Ogrzewanie, opłata stała'],
  [/^opłata za miejsce parkingowe$/u, 'Miejsce parkingowe'],
  [/^utrzymanie dźwigu$/u, 'Utrzymanie dźwigu'],
];

/** The name of a utility code, or the code itself when it has none. */
export const utilityName = (code: string) =>
  Object.hasOwn(UTILITY_NAMES, code) ? UTILITY_NAMES[code] : code;

/** The short name of an annual item, or its printed title when it has none. */
export function annualItemName(basis: string, title: string): string {
  const name = comparableText(basis);
  return ANNUAL_NAMES.find(([pattern]) => pattern.test(name))?.[1] ?? title;
}
