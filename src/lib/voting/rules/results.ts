const PERCENT = 100;

/** Whole-number share of `count` in `total`; zero when nobody voted. */
export function choicePercent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * PERCENT);
}
