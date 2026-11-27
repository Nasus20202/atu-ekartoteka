import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateConfirmationToken } from '@/lib/voting/rules/confirmation-token';
import { resolveVoteLink } from '@/lib/voting/use-cases/resolve-vote-link';

const mocks = vi.hoisted(() => ({
  findByToken: vi.fn(),
  findUserById: vi.fn(),
  findTenantVoting: vi.fn(),
  deleteConfirmation: vi.fn(),
}));

vi.mock('@/lib/voting/queries/find-vote-confirmation', () => ({
  findVoteConfirmationByToken: mocks.findByToken,
}));
vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: mocks.findUserById,
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVoting: mocks.findTenantVoting,
}));
vi.mock('@/lib/voting/queries/find-voter-apartments', () => ({
  findOwnedApartments: async (_u: string, _h: string, ids: string[]) =>
    ids
      .filter((id) => id.startsWith('apt'))
      .map((id) => ({ id, address: 'Lipowa', building: '1', number: id })),
}));
vi.mock('@/lib/voting/mutations/delete-vote-confirmation', () => ({
  deleteVoteConfirmation: mocks.deleteConfirmation,
}));

const NOW = new Date('2026-06-01T12:00:00Z');
const TOKEN = generateConfirmationToken();
const NO_ACCESS_MESSAGE = 'Twoje konto nie ma dostępu do głosowań';

const VOTING = {
  id: 'v1',
  title: 'Remont dachu',
  description: null,
  status: 'ACTIVE',
  endsAt: null,
  allowAbstain: true,
  hoa: { id: 'h1', name: 'Lipowa' },
  questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
};

function pending(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    votingId: 'v1',
    userId: 'user-1',
    answers: { 'apt-1': { q1: 'FOR' } },
    expiresAt: new Date('2026-06-01T12:10:00Z'),
    ...overrides,
  };
}

function resolve(token: unknown = TOKEN, now = NOW) {
  return resolveVoteLink({ userId: 'user-1', token, now });
}

describe('resolveVoteLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findByToken.mockResolvedValue(pending());
    mocks.findUserById.mockResolvedValue({ status: 'APPROVED' });
    mocks.findTenantVoting.mockResolvedValue(VOTING);
  });

  it('returns the voting and the stored answers of a usable link', async () => {
    expect(await resolve()).toMatchObject({
      ok: true,
      link: {
        confirmationId: 'c1',
        voting: {
          id: 'v1',
          title: 'Remont dachu',
          hoaId: 'h1',
          questions: [{ id: 'q1', text: 'Czy zgadzasz się?' }],
        },
        answers: { 'apt-1': { q1: 'FOR' } },
        ballots: [
          {
            apartmentId: 'apt-1',
            apartment: 'Lipowa 1/apt-1',
            answers: { q1: 'FOR' },
          },
        ],
      },
    });
    expect(mocks.findTenantVoting).toHaveBeenCalledWith('user-1', 'v1');
  });

  it('refuses a malformed token before any lookup', async () => {
    expect(await resolve('123456')).toEqual({
      ok: false,
      rejection: { reason: 'invalid-link' },
    });
    expect(mocks.findByToken).not.toHaveBeenCalled();
  });

  it('refuses a token that matches no link', async () => {
    mocks.findByToken.mockResolvedValue(null);

    expect(await resolve()).toEqual({
      ok: false,
      rejection: { reason: 'invalid-link' },
    });
  });

  it("refuses another user's link with the owner id and looks no further", async () => {
    mocks.findByToken.mockResolvedValue(pending({ userId: 'user-2' }));

    expect(await resolve()).toEqual({
      ok: false,
      rejection: { reason: 'foreign-link', ownerId: 'user-2' },
    });
    expect(mocks.findTenantVoting).not.toHaveBeenCalled();
  });

  it.each([
    ['at the moment it expires', NOW],
    ['after it expired', new Date('2026-06-01T12:20:00Z')],
  ])('refuses a link %s, deleting nothing', async (_label, now) => {
    mocks.findByToken.mockResolvedValue(pending({ expiresAt: NOW }));

    expect(await resolve(TOKEN, now)).toEqual({
      ok: false,
      rejection: { reason: 'expired', confirmationId: 'c1' },
    });
    expect(mocks.findTenantVoting).not.toHaveBeenCalled();
    expect(mocks.deleteConfirmation).not.toHaveBeenCalled();
  });

  it('refuses stored answers that no longer fit the questions', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ answers: { 'apt-1': { other: 'FOR' } } })
    );

    expect(await resolve()).toEqual({
      ok: false,
      rejection: { reason: 'unreadable-answers', confirmationId: 'c1' },
    });
    expect(mocks.deleteConfirmation).not.toHaveBeenCalled();
  });

  it('refuses an account that is not approved', async () => {
    mocks.findUserById.mockResolvedValue({ status: 'PENDING' });

    expect(await resolve()).toEqual({
      ok: false,
      rejection: {
        reason: 'no-access',
        failure: { ok: false, code: 'invalid', message: NO_ACCESS_MESSAGE },
      },
    });
    expect(mocks.findTenantVoting).not.toHaveBeenCalled();
  });

  it('refuses a voting the owner cannot see as not found', async () => {
    mocks.findTenantVoting.mockResolvedValue(null);

    expect(await resolve()).toMatchObject({
      ok: false,
      rejection: { reason: 'not-found', failure: { code: 'not-found' } },
    });
  });

  it.each([
    ['status is no longer active', { status: 'CLOSED' }],
    ['deadline has passed', { endsAt: new Date('2026-06-01T11:00:00Z') }],
  ])('refuses a voting whose %s as closed', async (_label, change) => {
    mocks.findTenantVoting.mockResolvedValue({ ...VOTING, ...change });

    expect(await resolve()).toMatchObject({
      ok: false,
      rejection: { reason: 'closed', failure: { code: 'invalid' } },
    });
  });

  it('uses the given time for the deadline of the voting', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ expiresAt: new Date('2026-06-01T13:00:00Z') })
    );
    mocks.findTenantVoting.mockResolvedValue({
      ...VOTING,
      endsAt: new Date('2026-06-01T12:30:00Z'),
    });

    expect(
      await resolve(TOKEN, new Date('2026-06-01T12:29:00Z'))
    ).toMatchObject({ ok: true });
    expect(
      await resolve(TOKEN, new Date('2026-06-01T12:31:00Z'))
    ).toMatchObject({ rejection: { reason: 'closed' } });
  });
});
