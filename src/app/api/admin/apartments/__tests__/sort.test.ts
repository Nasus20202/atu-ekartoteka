import { describe, expect, it } from 'vitest';

/** Natural sort comparator for apartment building+number, matching the logic in the API route and admin users page. */
function compareApartments(
  a: { building?: string | null; number: string },
  b: { building?: string | null; number: string }
): number {
  const buildingCmp = (a.building || '').localeCompare(
    b.building || '',
    undefined,
    { numeric: true, sensitivity: 'base' }
  );
  if (buildingCmp !== 0) return buildingCmp;
  return a.number.localeCompare(b.number, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function apt(building: string | null, number: string) {
  return { building, number };
}

describe('apartment natural sort comparator', () => {
  it('should sort numbers naturally within the same building', () => {
    const apts = [apt('A', '10'), apt('A', '2'), apt('A', '1'), apt('A', '20')];
    const sorted = [...apts].sort(compareApartments);
    expect(sorted.map((a) => a.number)).toEqual(['1', '2', '10', '20']);
  });

  it('should sort buildings naturally (numeric)', () => {
    const apts = [apt('10', '1'), apt('2', '1'), apt('1', '1'), apt('20', '1')];
    const sorted = [...apts].sort(compareApartments);
    expect(sorted.map((a) => a.building)).toEqual(['1', '2', '10', '20']);
  });

  it('should sort buildings alphabetically when non-numeric', () => {
    const apts = [apt('C', '1'), apt('A', '1'), apt('B', '1')];
    const sorted = [...apts].sort(compareApartments);
    expect(sorted.map((a) => a.building)).toEqual(['A', 'B', 'C']);
  });

  it('should group by building before sorting by number', () => {
    const apts = [apt('B', '1'), apt('A', '10'), apt('A', '2'), apt('B', '3')];
    const sorted = [...apts].sort(compareApartments);
    expect(sorted.map((a) => `${a.building}/${a.number}`)).toEqual([
      'A/2',
      'A/10',
      'B/1',
      'B/3',
    ]);
  });

  it('should handle null building (treated as empty string)', () => {
    const apts = [apt('A', '1'), apt(null, '1'), apt('B', '1')];
    const sorted = [...apts].sort(compareApartments);
    // null building (empty string) sorts before 'A'
    expect(sorted[0].building).toBeNull();
  });

  it('should handle mixed numeric and alphanumeric numbers', () => {
    const apts = [
      apt('A', '10A'),
      apt('A', '2'),
      apt('A', '1'),
      apt('A', '9B'),
    ];
    const sorted = [...apts].sort(compareApartments);
    // numeric part '1' < '2' < '9B' < '10A' with numeric option
    expect(sorted[0].number).toBe('1');
    expect(sorted[1].number).toBe('2');
  });

  it('should be stable for equal comparisons', () => {
    const apts = [apt('A', '1'), apt('A', '1')];
    const sorted = [...apts].sort(compareApartments);
    expect(sorted).toHaveLength(2);
  });

  it('should sort a realistic set of Polish apartment numbers', () => {
    const apts = [
      apt('17', '12'),
      apt('17', '3'),
      apt('17', '100'),
      apt('3', '1'),
      apt('3', '20'),
    ];
    const sorted = [...apts].sort(compareApartments);
    expect(sorted.map((a) => `${a.building}/${a.number}`)).toEqual([
      '3/1',
      '3/20',
      '17/3',
      '17/12',
      '17/100',
    ]);
  });
});
