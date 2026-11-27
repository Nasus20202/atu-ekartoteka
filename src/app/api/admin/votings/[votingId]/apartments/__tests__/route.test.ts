import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/admin/votings/[votingId]/apartments/route';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  find: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-admin', () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock('@/lib/voting/queries/find-meeting-ballot-apartments', () => ({
  findMeetingBallotApartments: mocks.find,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ error: mocks.error }),
}));

const get = (query = '') =>
  GET(new NextRequest(`http://localhost/api/x${query}`), {
    params: Promise.resolve({ votingId: 'v1' }),
  });

describe('voting apartments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({});
    mocks.find.mockResolvedValue([
      { id: 'a1', owner: null, address: 'A', building: '1', number: '2' },
    ]);
  });

  it('refuses before reading anything', async () => {
    mocks.requireAdmin.mockResolvedValue({
      response: NextResponse.json({}, { status: 403 }),
    });

    expect((await get()).status).toBe(403);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it.each([
    ['', ''],
    ['?search=Lip', 'Lip'],
  ])('searches the apartments of the voting: "%s"', async (query, search) => {
    const response = await get(query);

    expect(mocks.find).toHaveBeenCalledWith('v1', search);
    expect(await response.json()).toEqual({
      apartments: [{ id: 'a1', label: 'A 1/2' }],
    });
  });

  it('answers 500 without details', async () => {
    mocks.find.mockRejectedValue(new Error('secret'));

    const response = await get();

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('secret');
    expect(mocks.error).toHaveBeenCalled();
  });
});
