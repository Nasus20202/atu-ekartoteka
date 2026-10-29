import { describe, expect, it } from 'vitest';

import { getPeriodYear, groupByYearDesc } from '@/lib/utils/group-by-year';

describe('groupByYearDesc', () => {
  it('groups periods by year, newest first, keeping order', () => {
    expect(
      groupByYearDesc(['2024-12', '2025-03', '2025-01'], getPeriodYear)
    ).toEqual([
      { year: '2025', items: ['2025-03', '2025-01'] },
      { year: '2024', items: ['2024-12'] },
    ]);
  });

  it('sorts numeric years numerically', () => {
    const items = [{ year: 999 }, { year: 2025 }, { year: 2024 }];

    expect(
      groupByYearDesc(items, (item) => item.year).map((g) => g.year)
    ).toEqual([2025, 2024, 999]);
  });

  it('returns no groups for no items', () => {
    expect(groupByYearDesc([], getPeriodYear)).toEqual([]);
  });
});
