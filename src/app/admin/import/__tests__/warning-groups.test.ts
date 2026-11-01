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
