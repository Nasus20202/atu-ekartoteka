import { beforeEach, describe, expect, it } from 'vitest';

import {
  mocks,
  resetImportMocks,
  upload,
} from '@/__tests__/helpers/settlement-import/import-mocks';
import {
  FIXTURE_APARTMENT,
  utilityDocument,
} from '@/__tests__/helpers/settlement-pdf/documents';
import { importSettlements } from '@/lib/settlements/use-cases/import-settlements';
import { previewSettlements } from '@/lib/settlements/use-cases/preview-settlements';

const stored = () => utilityDocument().records[0];

describe('settlement import', () => {
  beforeEach(() => {
    resetImportMocks();
  });

  it('writes a new record', async () => {
    const result = await importSettlements([upload('a.pdf')], []);

    expect(result.success).toBe(true);
    expect(result.files[0].stats).toEqual({
      created: 1,
      updated: 0,
      unchanged: 0,
    });
    expect(mocks.save).toHaveBeenCalledWith(
      [expect.objectContaining({ status: 'new' })],
      'a.pdf'
    );
  });

  it.each([
    ['the same file', {}],
    ['a reprint with another issue date', { issued: '01/01/2023' }],
  ])('leaves %s unchanged', async (_, page) => {
    mocks.parse.mockResolvedValue(utilityDocument(page));
    mocks.stored.mockResolvedValue(stored());

    const result = await importSettlements([upload('other name.pdf')], []);

    expect(result.files[0]).toMatchObject({
      imported: true,
      stats: { created: 0, updated: 0, unchanged: 1 },
    });
    expect(mocks.save).toHaveBeenCalledWith([], 'other name.pdf');
  });

  it('replaces a different record only with the confirmation', async () => {
    mocks.stored.mockResolvedValue({
      ...stored(),
      printedOwner: 'Kowalska A.',
    });
    const [preview] = (await previewSettlements([upload('a.pdf')])).files;
    const { key, confirmations } = preview.records[0];
    expect(confirmations).toEqual(['replace']);

    const refused = await importSettlements([upload('a.pdf')], []);

    expect(refused.success).toBe(false);
    expect(refused.files[0].errors).toEqual([
      expect.objectContaining({ kind: 'confirmation' }),
    ]);
    expect(mocks.save).not.toHaveBeenCalled();

    const accepted = await importSettlements(
      [upload('a.pdf')],
      [{ key, reason: 'replace' }]
    );

    expect(accepted.files[0].stats.updated).toBe(1);
  });

  it('does not apply a confirmation to other content', async () => {
    mocks.candidates.mockResolvedValue([
      { ...FIXTURE_APARTMENT, owner: 'Kowalska Anna D' },
    ]);
    const [preview] = (await previewSettlements([upload('a.pdf')])).files;
    const { key, confirmations } = preview.records[0];
    expect(confirmations).toEqual(['owner-annotation']);
    mocks.parse.mockResolvedValue(utilityDocument({ meters: [] }));

    const result = await importSettlements(
      [upload('a.pdf')],
      [{ key, reason: 'owner-annotation' }]
    );

    expect(result.success).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('writes only the files without errors', async () => {
    mocks.parse
      .mockResolvedValueOnce(
        utilityDocument({ period: ['01/10/2022', '31/12/2022'], total: 'x' })
      )
      .mockResolvedValueOnce(utilityDocument());

    const result = await importSettlements(
      [upload('bad.pdf'), upload('good.pdf')],
      []
    );

    expect(result.files.map((f) => f.imported)).toEqual([false, true]);
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it('writes nothing from a file when one of its records has an error', async () => {
    mocks.parse.mockResolvedValue(utilityDocument({}, { owner: 'Nowak Jan' }));

    const result = await importSettlements([upload('a.pdf')], []);

    expect(result.files[0].errors).toEqual([
      expect.objectContaining({
        kind: 'match',
        message: expect.stringContaining('Nowak Jan'),
      }),
    ]);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('reports a file that could not be saved and logs the error', async () => {
    mocks.save.mockRejectedValue(new Error('unique'));

    const result = await importSettlements([upload('a.pdf')], []);

    expect(result.files[0]).toMatchObject({
      imported: false,
      stats: { created: 0, updated: 0, unchanged: 0 },
      errors: [{ kind: 'database' }],
    });
    expect(mocks.logError).toHaveBeenCalled();
  });
});
