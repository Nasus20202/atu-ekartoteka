import { describe, expect, it } from 'vitest';

import { ERROR_GROUPS, groupErrors } from '@/app/admin/import/error-groups';
import type { ImportErrorItem } from '@/lib/import/types';

function error(
  kind: ImportErrorItem['kind'],
  message: string
): ImportErrorItem {
  return { kind, message };
}

describe('groupErrors', () => {
  it('returns no groups without errors', () => {
    expect(groupErrors([])).toEqual([]);
  });

  it('groups errors by kind in the display order, keeping their order within a group', () => {
    const groups = groupErrors([
      error('transaction', 'T1'),
      error('balance-mismatch', 'B1'),
      error('transaction', 'T2'),
    ]);

    expect(groups.map(({ kind }) => kind)).toEqual([
      'balance-mismatch',
      'transaction',
    ]);
    expect(groups[1].items.map(({ message }) => message)).toEqual(['T1', 'T2']);
  });

  it('attaches the title and description of each kind', () => {
    const [group] = groupErrors([error('database', 'D1')]);

    expect(group.title).toBe(ERROR_GROUPS.database.title);
    expect(group.description).toBe(ERROR_GROUPS.database.description);
  });

  it('keeps the file and HOA fields of batch errors', () => {
    const [group] = groupErrors([
      { kind: 'file-error', file: 'HOA1/a.txt', message: 'Nieznany plik' },
    ]);

    expect(group.items[0]).toMatchObject({ file: 'HOA1/a.txt' });
  });
});
