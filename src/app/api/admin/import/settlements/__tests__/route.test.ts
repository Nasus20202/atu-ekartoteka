import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gzipSync } from 'zlib';

import { expectNoPersonalData } from '@/__tests__/helpers/expect-no-personal-data';
import {
  FIXTURE_APARTMENT,
  FIXTURE_CHARGES,
  utilityDocument,
} from '@/__tests__/helpers/settlement-pdf/documents';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  parse: vi.fn(),
  save: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/auth/queries/has-admin-access', () => ({
  hasAdminAccess: (userId: string) =>
    Promise.resolve(userId.startsWith('admin')),
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mocks.log,
}));
vi.mock('@/lib/settlements/parsers/parse-settlement-pdf', () => ({
  parseSettlementPdf: mocks.parse,
}));
vi.mock('@/lib/settlements/queries/find-match-candidates', () => ({
  findCandidatesByExternalId: () => Promise.resolve([FIXTURE_APARTMENT]),
  findCandidatesByAddress: () => Promise.resolve([]),
}));
vi.mock('@/lib/settlements/queries/find-settlement-charges', () => ({
  findApartmentCharges: () => Promise.resolve(FIXTURE_CHARGES),
  findCommunityCharges: () => Promise.resolve([]),
}));
vi.mock('@/lib/settlements/queries/find-stored-periods', () => ({
  findOverlappingPeriods: () => Promise.resolve([]),
}));
vi.mock('@/lib/settlements/queries/find-meter-history', () => ({
  findMeterHistory: () => Promise.resolve([]),
}));
vi.mock('@/lib/settlements/queries/find-stored-settlement', () => ({
  findStoredUtilityContent: () => Promise.resolve(null),
  findStoredAnnualContent: () => Promise.resolve(null),
}));
vi.mock('@/lib/settlements/mutations/save-settlements', () => ({
  saveSettlements: mocks.save,
}));

import { POST as preview } from '@/app/api/admin/import/settlements/preview/route';
import { POST as importFiles } from '@/app/api/admin/import/settlements/route';

const FILE_NAME = 'Kowalska rozliczenie.pdf';
const FILE = {
  path: FILE_NAME,
  name: FILE_NAME,
  content: gzipSync(Buffer.from('%PDF')).toString('base64'),
};

const request = (body: unknown, headers: Record<string, string> = {}) =>
  ({ json: async () => body, headers: new Headers(headers) }) as NextRequest;

describe.each([
  ['preview', preview],
  ['import', importFiles],
])('settlement %s route', (name, post) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1' } });
    mocks.parse.mockResolvedValue(utilityDocument());
  });

  it.each([
    [401, null],
    [403, { user: { id: 'tenant-1' } }],
  ])('answers %i without reading the files', async (status, session) => {
    mocks.auth.mockResolvedValue(session);
    const req = { json: vi.fn() } as unknown as NextRequest;

    expect((await post(req)).status).toBe(status);
    expect(req.json).not.toHaveBeenCalled();
    expect(mocks.parse).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    ['no files', { files: [] }],
    ['no body', null],
    ['a file without content', { files: [{ name: 'a.pdf' }] }],
    ['an unknown confirmation', { files: [FILE], confirmations: [{}] }],
    ['a confirmation of nothing', { files: [FILE], confirmations: [null] }],
    ['content that is not compressed', { files: [{ ...FILE, content: 'x' }] }],
    ['an option that is not a flag', { files: [FILE], cleanImport: 'yes' }],
    ['another such option', { files: [FILE], skipValidation: 1 }],
  ])('answers 400 for %s', async (_, body) => {
    expect((await post(request(body))).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('answers 400 for a body that is not JSON', async () => {
    const req = request(null);
    req.json = () => Promise.reject(new SyntaxError('Unexpected token'));

    expect((await post(req)).status).toBe(400);
  });

  it('answers 413 for a body above the limit without reading it', async () => {
    const req = request({ files: [FILE] }, { 'content-length': '999999999' });
    const json = vi.spyOn(req, 'json');

    expect((await post(req)).status).toBe(413);
    expect(json).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('logs counts without names, file names or findings', async () => {
    const response = await post(request({ files: [FILE] }));

    expect(response.status).toBe(200);
    expectNoPersonalData(Object.values(mocks.log), ['Kowalska', FILE_NAME]);
    expect(mocks.save).toHaveBeenCalledTimes(name === 'import' ? 1 : 0);
  });

  it('answers 500 without details when reading fails', async () => {
    mocks.parse.mockRejectedValue(new Error('secret detail'));

    const response = await post(request({ files: [FILE] }));

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('secret');
  });
});
