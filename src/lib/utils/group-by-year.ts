const PERIOD_YEAR_LENGTH = 4;

export interface YearGroup<Year, Item> {
  year: Year;
  items: Item[];
}

/** Groups items by year, newest year first, keeping item order. */
export function groupByYearDesc<Year extends string | number, Item>(
  items: Item[],
  getYear: (item: Item) => Year
): YearGroup<Year, Item>[] {
  const groups = new Map<Year, Item[]>();
  for (const item of items) {
    const year = getYear(item);
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return Array.from(groups, ([year, grouped]) => ({
    year,
    items: grouped,
  })).sort((a, b) =>
    String(b.year).localeCompare(String(a.year), undefined, { numeric: true })
  );
}

/** Year part of a "YYYY-MM" or "YYYYMM" period. */
export function getPeriodYear(period: string): string {
  return period.slice(0, PERIOD_YEAR_LENGTH);
}
