import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FIXTURE_APARTMENT,
  FIXTURE_CHARGES,
  utilityDocument,
} from '@/__tests__/helpers/settlement-pdf/documents';

const mocks = vi.hoisted(() => ({
  parse: vi.fn(),
  candidates: vi.fn(),
  charges: vi.fn(),
  overlapping: vi.fn(),
  history: vi.fn(),
  stored: vi.fn(),
  save: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/settlements/parsers/parse-settlement-pdf', () => ({
  parseSettlementPdf: mocks.parse,
}));
vi.mock('@/lib/settlements/queries/find-match-candidates', () => ({
  findCandidatesByExternalId: mocks.candidates,
  findCandidatesByAddress: mocks.candidates,
}));
vi.mock('@/lib/settlements/queries/find-settlement-charges', () => ({
  findApartmentCharges: mocks.charges,
  findCommunityCharges: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/settlements/queries/find-stored-periods', () => ({
  findOverlappingPeriods: mocks.overlapping,
}));
vi.mock('@/lib/settlements/queries/find-meter-history', () => ({
  findMeterHistory: mocks.history,
}));
vi.mock('@/lib/settlements/queries/find-stored-settlement', () => ({
  findStoredUtilityContent: mocks.stored,
  findStoredAnnualContent: mocks.stored,
}));
vi.mock('@/lib/settlements/mutations/save-settlements', () => ({
  saveSettlements: mocks.save,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: mocks.logError }),
}));

import { importMetrics } from '@/lib/platform/opentelemetry/import-metrics';
import { previewSettlements } from '@/lib/settlements/use-cases/preview-settlements';

const upload = (fileName: string) => ({
  fileName,
  data: new Uint8Array(),
});

describe('settlement preview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.parse.mockResolvedValue(utilityDocument());
    mocks.candidates.mockResolvedValue([FIXTURE_APARTMENT]);
    mocks.charges.mockResolvedValue(FIXTURE_CHARGES);
    mocks.overlapping.mockResolvedValue([]);
    mocks.history.mockResolvedValue([]);
    mocks.stored.mockResolvedValue(null);
  });

  it('previews a new record without writing', async () => {
    const { files } = await previewSettlements([upload('a.pdf')]);

    expect(files[0]).toMatchObject({
      fileName: 'a.pdf',
      documentType: 'utility',
      errors: [],
      warnings: [],
      records: [
        {
          status: 'new',
          confirmations: [],
          matchedOwner: 'Kowalska Anna',
          totalAmount: '-150.40',
          periodFrom: '2022-05-01',
        },
      ],
    });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    ['nie ma takiego lokalu', []],
    [
      'pasuje więcej niż jeden lokal',
      [FIXTURE_APARTMENT, { ...FIXTURE_APARTMENT, id: 'apartment-2' }],
    ],
  ])('blocks a record when %s', async (reason, candidates) => {
    mocks.candidates.mockResolvedValue(candidates);

    const [file] = (await previewSettlements([upload('a.pdf')])).files;

    expect(file.records[0]).toMatchObject({
      status: 'blocked',
      apartmentExternalId: null,
      matchedOwner: null,
    });
    expect(file.errors[0].message).toContain(reason);
  });

  it('reports a file that cannot be read', async () => {
    mocks.parse.mockResolvedValue({
      type: null,
      records: [],
      problems: [{ kind: 'unreadable', message: 'Nie można odczytać.' }],
    });

    const {
      files: [file],
    } = await previewSettlements([upload('a.pdf')]);

    expect(file).toMatchObject({
      errors: [{ kind: 'unreadable', fileName: 'a.pdf', severity: 'error' }],
    });
  });
});

describe('settlement preview metrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.parse.mockResolvedValue(utilityDocument());
    mocks.candidates.mockResolvedValue([FIXTURE_APARTMENT]);
    mocks.charges.mockResolvedValue(FIXTURE_CHARGES);
    mocks.overlapping.mockResolvedValue([]);
    mocks.history.mockResolvedValue([]);
    mocks.stored.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const unreadable = {
    type: null,
    records: [],
    problems: [{ kind: 'unreadable' as const, message: 'Nie można odczytać.' }],
  };

  it('counts a clean preview as a success without records', async () => {
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');
    const recordFinding = vi.spyOn(importMetrics, 'recordFinding');

    await previewSettlements([upload('a.pdf')]);

    expect(recordRun).toHaveBeenCalledWith(
      'settlement_preview',
      'success',
      expect.any(Number)
    );
    expect(recordRecords).not.toHaveBeenCalled();
    expect(recordFinding).not.toHaveBeenCalled();
  });

  it('counts a file with errors as a failure and each finding once', async () => {
    mocks.parse.mockResolvedValue(unreadable);
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordFinding = vi.spyOn(importMetrics, 'recordFinding');

    await previewSettlements([upload('a.pdf')]);

    expect(recordRun).toHaveBeenCalledWith(
      'settlement_preview',
      'failure',
      expect.any(Number)
    );
    expect(recordFinding).toHaveBeenCalledTimes(1);
    expect(recordFinding).toHaveBeenCalledWith('settlement_preview', {
      severity: 'error',
      kind: 'unreadable',
    });
  });

  it('counts a preview where some files have errors as a partial run', async () => {
    mocks.parse
      .mockResolvedValueOnce(unreadable)
      .mockResolvedValueOnce(utilityDocument());
    const recordRun = vi.spyOn(importMetrics, 'recordRun');

    await previewSettlements([upload('bad.pdf'), upload('good.pdf')]);

    expect(recordRun).toHaveBeenCalledWith(
      'settlement_preview',
      'partial',
      expect.any(Number)
    );
  });
});
