import { comparableText } from '@/lib/settlements/rules/normalize-text';

// What the legacy system appends to a name to tell records apart
const ANNOTATIONS = [
  /^[#@]/,
  /^\p{L}$/u,
  /^(\p{L}+\d[\p{L}\d]*|\d+\p{L}+)$/u,
  /^\d+([,;/+]\d+)*[,;]?$/,
  /^-$/,
];

const isAnnotation = (token: string) =>
  ANNOTATIONS.some((pattern) => pattern.test(token));

/** True when two different names differ only in trailing annotations. */
export function differsByAnnotation(first: string, second: string): boolean {
  const [a, b] = [first, second].map((name) => comparableText(name).split(' '));
  let shared = 0;
  while (shared < a.length && a[shared] === b[shared]) shared++;
  const rest = [...a.slice(shared), ...b.slice(shared)];
  return shared > 0 && rest.length > 0 && rest.every(isAnnotation);
}

export type OwnerMatch<T> =
  | { status: 'exact' | 'annotation'; apartment: T }
  | { status: 'none' | 'ambiguous' };

/** Picks the one apartment record of the printed owner; never guesses. */
export function matchOwner<T extends { owner: string | null }>(
  printedOwner: string,
  candidates: T[]
): OwnerMatch<T> {
  const printed = comparableText(printedOwner);
  const exact = candidates.filter(
    ({ owner }) => owner !== null && comparableText(owner) === printed
  );
  const matches = exact.length
    ? exact
    : candidates.filter(
        ({ owner }) =>
          owner !== null && differsByAnnotation(owner, printedOwner)
      );

  if (matches.length > 1) return { status: 'ambiguous' };
  if (matches.length === 0) return { status: 'none' };
  return {
    status: exact.length ? 'exact' : 'annotation',
    apartment: matches[0],
  };
}
