import { beforeEach, describe, expect, it } from 'vitest';

import {
  mocks,
  resetImportMocks,
  upload,
} from '@/__tests__/helpers/settlement-import/import-mocks';
import { importSettlements } from '@/lib/settlements/use-cases/import-settlements';

const UNVALIDATED = { cleanImport: false, skipValidation: true };

describe('settlement import without validation', () => {
  beforeEach(() => {
    resetImportMocks();
    mocks.overlapping.mockResolvedValue([
      { periodFrom: '2022-01-01', periodTo: '2022-05-31' },
    ]);
  });

  it('blocks on a failed check by default', async () => {
    const result = await importSettlements([upload('a.pdf')], []);

    expect(result.success).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('writes the file and keeps the finding as a warning', async () => {
    const result = await importSettlements([upload('a.pdf')], [], UNVALIDATED);

    expect(result.success).toBe(true);
    expect(result.files[0].errors).toEqual([]);
    expect(result.files[0].warnings).toContainEqual(
      expect.objectContaining({ kind: 'overlap', severity: 'warning' })
    );
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it('still refuses a record without an apartment', async () => {
    mocks.candidates.mockResolvedValue([]);

    const result = await importSettlements([upload('a.pdf')], [], UNVALIDATED);

    expect(result.files[0].errors).toEqual([
      expect.objectContaining({ kind: 'match' }),
    ]);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
