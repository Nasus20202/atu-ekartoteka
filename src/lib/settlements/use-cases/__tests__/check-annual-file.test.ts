import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FIXTURE_APARTMENT } from '@/__tests__/helpers/settlement-pdf/documents';
import { parsedAnnualRecord } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import { toDecimal } from '@/lib/shared/utils/decimal';

const mocks = vi.hoisted(() => ({
  parse: vi.fn(),
  byAddress: vi.fn(),
  charges: vi.fn(),
  community: vi.fn(),
}));

vi.mock('@/lib/settlements/parsers/parse-settlement-pdf', () => ({
  parseSettlementPdf: mocks.parse,
}));
vi.mock('@/lib/settlements/queries/find-match-candidates', () => ({
  findCandidatesByExternalId: vi.fn(),
  findCandidatesByAddress: mocks.byAddress,
}));
vi.mock('@/lib/settlements/queries/find-settlement-charges', () => ({
  findApartmentCharges: mocks.charges,
  findCommunityCharges: mocks.community,
}));
vi.mock('@/lib/settlements/queries/find-stored-periods', () => ({
  findOverlappingPeriods: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/settlements/queries/find-stored-settlement', () => ({
  findStoredUtilityContent: vi.fn(),
  findStoredAnnualContent: vi.fn().mockResolvedValue(null),
}));

import { previewSettlements } from '@/lib/settlements/use-cases/preview-settlements';

describe('annual settlement preview', () => {
  beforeEach(() => {
    mocks.parse.mockResolvedValue({
      type: 'annual',
      records: [parsedAnnualRecord()],
      ownerTotals: [
        {
          page: 1,
          printedOwner: 'Kowalska Anna',
          total: toDecimal('-32'),
          apartmentSum: toDecimal('-30'),
        },
      ],
      problems: [],
    });
    mocks.byAddress.mockResolvedValue([FIXTURE_APARTMENT]);
    mocks.charges.mockResolvedValue([]);
    mocks.community.mockResolvedValue([]);
  });

  it('matches by address and checks every item against the year', async () => {
    const [file] = (
      await previewSettlements([{ fileName: 'r.pdf', data: new Uint8Array() }])
    ).files;

    expect(mocks.byAddress).toHaveBeenCalledWith({
      street: 'Lipowa',
      building: '5',
      number: '1',
    });
    expect(mocks.charges.mock.calls[0][1]).toContain('202512');
    expect(mocks.community).toHaveBeenCalledWith('hoa-1', 2025);
    expect(mocks.community).toHaveBeenCalledTimes(1);
    expect(file.errors).toEqual([
      expect.objectContaining({ kind: 'inconsistent' }),
    ]);
    expect(file.warnings).toEqual([
      expect.objectContaining({ kind: 'not-verified' }),
    ]);
  });

  it('loads the association charges once for items of the same year', async () => {
    const record = parsedAnnualRecord();
    mocks.parse.mockResolvedValue({
      type: 'annual',
      records: [{ ...record, items: [...record.items, ...record.items] }],
      ownerTotals: [],
      problems: [],
    });

    await previewSettlements([{ fileName: 'r.pdf', data: new Uint8Array() }]);

    expect(mocks.community).toHaveBeenCalledTimes(1);
  });
});
