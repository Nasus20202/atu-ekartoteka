import { beforeEach, describe, expect, it } from 'vitest';

import {
  mocks,
  resetImportMocks,
  upload,
} from '@/__tests__/helpers/settlement-import/import-mocks';
import { utilityDocument } from '@/__tests__/helpers/settlement-pdf/documents';
import { importSettlements } from '@/lib/settlements/use-cases/import-settlements';
import { previewSettlements } from '@/lib/settlements/use-cases/preview-settlements';

const CLEAN = { cleanImport: true, skipValidation: false };
const PERIOD = { periodFrom: '2022-05-01', periodTo: '2022-09-30' };
const OVERLAP = {
  periodFrom: '2022-01-01',
  periodTo: '2022-05-31',
};
const SCOPE = [
  { type: 'utility', homeownersAssociationId: 'hoa-1', periods: [PERIOD] },
];
const changed = () => ({
  ...utilityDocument().records[0],
  printedOwner: 'Kowalska A.',
});

describe('clean settlement import', () => {
  beforeEach(() => resetImportMocks());

  it('previews every record as new, with what would be removed', async () => {
    mocks.stored.mockResolvedValue(changed());
    mocks.countReplaced.mockResolvedValue(4);

    const preview = await previewSettlements([upload('a.pdf')], CLEAN);

    expect(preview.removals).toBe(4);
    expect(preview.files[0].records[0]).toMatchObject({
      status: 'new',
      confirmations: [],
    });
    expect(mocks.countReplaced).toHaveBeenCalledWith(SCOPE);
    expect(mocks.overlapping.mock.calls[0][3]).toEqual(SCOPE);
  });

  it('counts nothing to remove in a standard preview', async () => {
    await previewSettlements([upload('a.pdf')]);

    expect(mocks.countReplaced).toHaveBeenCalledWith([]);
  });

  it('replaces the periods and writes the files without a confirmation', async () => {
    mocks.stored.mockResolvedValue(changed());

    const result = await importSettlements([upload('a.pdf')], [], CLEAN);

    expect(result).toMatchObject({ success: true, removed: 1 });
    expect(result.files[0]).toMatchObject({
      imported: true,
      stats: { created: 1, updated: 0, unchanged: 0 },
    });
    expect(mocks.replace).toHaveBeenCalledWith(SCOPE, [
      {
        fileName: 'a.pdf',
        records: [expect.objectContaining({ status: 'new' })],
      },
    ]);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('removes and writes nothing when one file has an error', async () => {
    mocks.overlapping
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([OVERLAP]);
    mocks.parse
      .mockResolvedValueOnce(utilityDocument())
      .mockResolvedValueOnce(
        utilityDocument({ period: ['01/01/2022', '30/04/2022'] })
      );

    const result = await importSettlements(
      [upload('good.pdf'), upload('bad.pdf')],
      [],
      CLEAN
    );

    expect(result).toMatchObject({ success: false, removed: 0 });
    expect(result.files.map((file) => file.imported)).toEqual([false, false]);
    expect(result.files[0].errors).toEqual([
      expect.objectContaining({ kind: 'aborted' }),
    ]);
    expect(result.files[1].errors).toEqual([
      expect.objectContaining({ kind: 'overlap' }),
    ]);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('reports a failed write on every file', async () => {
    mocks.replace.mockRejectedValue(new Error('down'));

    const result = await importSettlements([upload('a.pdf')], [], CLEAN);

    expect(result).toMatchObject({ success: false, removed: 0 });
    expect(result.files[0].errors).toEqual([
      expect.objectContaining({ kind: 'database' }),
    ]);
    expect(mocks.logError).toHaveBeenCalled();
  });
});
