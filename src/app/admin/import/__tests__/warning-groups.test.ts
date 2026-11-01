import { describe, expect, it } from 'vitest';

import {
  groupWarnings,
  WARNING_GROUPS,
} from '@/app/admin/import/warning-groups';
import type { ImportWarning } from '@/lib/import/types';

function warning(
  kind: ImportWarning['kind'],
  apartmentExternalId: string
): ImportWarning {
  return { kind, apartmentExternalId, message: `uwaga ${apartmentExternalId}` };
}

describe('groupWarnings', () => {
  it('returns no groups without warnings', () => {
    expect(groupWarnings([])).toEqual([]);
  });

  it('groups warnings by kind in the display order, keeping their order within a group', () => {
    const groups = groupWarnings([
      warning('skipped-records', 'A1'),
      warning('line-total', 'A2'),
      warning('skipped-records', 'A3'),
      warning('charges-mismatch', 'A4'),
    ]);

    expect(groups.map(({ kind }) => kind)).toEqual([
      'charges-mismatch',
      'line-total',
      'skipped-records',
    ]);
    expect(groups[2].items.map((w) => w.apartmentExternalId)).toEqual([
      'A1',
      'A3',
    ]);
  });

  it('attaches the title and description of each kind', () => {
    const [group] = groupWarnings([warning('line-total', 'A1')]);

    expect(group.title).toBe(WARNING_GROUPS['line-total'].title);
    expect(group.description).toBe(WARNING_GROUPS['line-total'].description);
  });
});

describe('groupWarnings summary', () => {
  function mismatch(
    apartmentExternalId: string,
    year: number,
    differing: number,
    explainedBySettlement: number
  ): ImportWarning {
    return {
      kind: 'charges-mismatch',
      apartmentExternalId,
      year,
      months: { differing, explainedBySettlement },
      message: 'uwaga',
    };
  }

  it('totals the differing months per year, in year order', () => {
    const [group] = groupWarnings([
      mismatch('A1', 2025, 4, 3),
      mismatch('A2', 2024, 2, 0),
      mismatch('A3', 2025, 2, 1),
    ]);

    expect(group.summary).toEqual([
      'Rok 2024 (1 lok.): 2 mies. z różnicą — 0 równa wyrównaniom, 2 poza wyrównaniami',
      'Rok 2025 (2 lok.): 6 mies. z różnicą — 4 równa wyrównaniom, 2 poza wyrównaniami',
    ]);
  });

  it('has no summary for groups without one', () => {
    const [group] = groupWarnings([
      { kind: 'line-total', apartmentExternalId: 'A1', message: 'uwaga' },
    ]);

    expect(group.summary).toBeUndefined();
  });
});
