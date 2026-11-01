import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processBatchImport } from '@/lib/import/import-handler';

const { mockTransaction, mockParseWplatyFile, mockValidateWplaty } = vi.hoisted(
  () => ({
    mockTransaction: vi.fn(),
    mockParseWplatyFile: vi.fn(),
    mockValidateWplaty: vi.fn(),
  })
);

vi.mock('@/lib/database/prisma', () => ({
  prisma: { $transaction: mockTransaction },
}));

vi.mock('@/lib/parsers/wplaty-parser', () => ({
  parseWplatyFile: mockParseWplatyFile,
}));

vi.mock('@/lib/import/validators', () => ({
  validateNalCzynsz: () => [],
  validateWplaty: mockValidateWplaty,
  validateChargesCrossFile: () => [],
}));

function makeFile(name: string): File {
  return new File(['data'], name, { type: 'text/plain' });
}

function payment(apartmentCode: string, year: number) {
  return { externalId: 'W001', apartmentCode, year };
}

describe('processBatchImport with several files of one kind', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWplaty.mockReturnValue([]);
    mockTransaction.mockResolvedValue(undefined);
  });

  it('merges the entries of all payment files', async () => {
    mockParseWplatyFile
      .mockResolvedValueOnce({ entries: [payment('A1', 2025)] })
      .mockResolvedValueOnce({ entries: [payment('A1', 2026)] });

    const { results } = await processBatchImport([
      makeFile('hoa1/wplaty1.txt'),
      makeFile('hoa1/wplaty2.txt'),
    ]);

    expect(results[0].errors.map(({ message }) => message)).toEqual([]);
    expect(results[0].payments?.total).toBe(2);
    expect(mockValidateWplaty).toHaveBeenCalledWith([
      payment('A1', 2025),
      payment('A1', 2026),
    ]);
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('stops before the transaction when files repeat a record', async () => {
    mockParseWplatyFile
      .mockResolvedValueOnce({ entries: [payment('A1', 2025)] })
      .mockResolvedValueOnce({ entries: [payment('A1', 2025)] });

    const { results } = await processBatchImport(
      [makeFile('hoa1/wplaty1.txt'), makeFile('hoa1/wplaty2.txt')],
      { skipValidation: true }
    );

    expect(results[0].errors.map(({ message }) => message)).toEqual([
      'Zduplikowane rekordy w plikach wplaty1.txt i wplaty2.txt (1): W001#A1|2025',
    ]);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
