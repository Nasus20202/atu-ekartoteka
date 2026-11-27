import { vi } from 'vitest';

import {
  FIXTURE_APARTMENT,
  FIXTURE_CHARGES,
  utilityDocument,
} from '@/__tests__/helpers/settlement-pdf/documents';

const hoisted = vi.hoisted(() => ({
  parse: vi.fn(),
  candidates: vi.fn(),
  charges: vi.fn(),
  overlapping: vi.fn(),
  history: vi.fn(),
  stored: vi.fn(),
  save: vi.fn(),
  replace: vi.fn(),
  countReplaced: vi.fn(),
  logError: vi.fn(),
}));

export const mocks = hoisted;

vi.mock('@/lib/settlements/parsers/parse-settlement-pdf', () => ({
  parseSettlementPdf: hoisted.parse,
}));
vi.mock('@/lib/settlements/queries/find-match-candidates', () => ({
  findCandidatesByExternalId: hoisted.candidates,
  findCandidatesByAddress: hoisted.candidates,
}));
vi.mock('@/lib/settlements/queries/find-settlement-charges', () => ({
  findApartmentCharges: hoisted.charges,
  findCommunityCharges: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/settlements/queries/find-stored-periods', () => ({
  findOverlappingPeriods: hoisted.overlapping,
}));
vi.mock('@/lib/settlements/queries/find-meter-history', () => ({
  findMeterHistory: hoisted.history,
}));
vi.mock('@/lib/settlements/queries/find-stored-settlement', () => ({
  findStoredUtilityContent: hoisted.stored,
  findStoredAnnualContent: hoisted.stored,
}));
vi.mock('@/lib/settlements/mutations/save-settlements', () => ({
  saveSettlements: hoisted.save,
  replaceSettlements: hoisted.replace,
}));
vi.mock('@/lib/settlements/queries/count-replaced-settlements', () => ({
  countReplacedSettlements: hoisted.countReplaced,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: hoisted.logError }),
}));

export const upload = (fileName: string) => ({
  fileName,
  data: new Uint8Array(),
});

export function resetImportMocks() {
  vi.resetAllMocks();
  mocks.parse.mockResolvedValue(utilityDocument());
  mocks.candidates.mockResolvedValue([FIXTURE_APARTMENT]);
  mocks.charges.mockResolvedValue(FIXTURE_CHARGES);
  mocks.overlapping.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
  mocks.stored.mockResolvedValue(null);
  mocks.replace.mockResolvedValue({ utility: 1, annual: 0 });
  mocks.countReplaced.mockResolvedValue(0);
}
