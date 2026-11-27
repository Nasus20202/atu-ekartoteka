import { describe, expect, it } from 'vitest';

import { bad, good } from '@/__tests__/helpers/settlement-pdf/preview-files';
import { findImportBlockers } from '@/components/settlement-import/import-blockers';

describe('findImportBlockers', () => {
  it('counts the errors of a file instead of its confirmations', () => {
    const file = { ...bad, records: good.records };

    expect(findImportBlockers([file], [])).toEqual([
      { fileName: 'bad.pdf', errors: bad.errors.length, missing: 0 },
    ]);
  });

  it('counts the confirmations not ticked yet', () => {
    expect(
      findImportBlockers([good], [{ key: 'key-1', reason: 'replace' }])
    ).toEqual([{ fileName: 'good.pdf', errors: 0, missing: 1 }]);
  });

  it('finds nothing once every confirmation is ticked', () => {
    expect(
      findImportBlockers(
        [good],
        [
          { key: 'key-1', reason: 'replace' },
          { key: 'key-1', reason: 'owner-annotation' },
        ]
      )
    ).toEqual([]);
  });
});
