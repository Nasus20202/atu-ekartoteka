import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hashConfirmationToken } from '@/lib/voting/rules/confirmation-token';
import { requestVoteConfirmation } from '@/lib/voting/use-cases/request-vote-confirmation';

const mocks = vi.hoisted(() => ({
  resolveOpenVoting: vi.fn(),
  findVotableApartmentIds: vi.fn(),
  findRecent: vi.fn(),
  saveVoteConfirmation: vi.fn(),
  deleteVoteConfirmation: vi.fn(),
  findUserById: vi.fn(),
  send: vi.fn(),
}));

vi.mock('@/lib/voting/use-cases/vote-access', () => ({
  resolveOpenVoting: mocks.resolveOpenVoting,
}));
vi.mock('@/lib/voting/queries/find-voter-apartments', () => ({
  findVotableApartmentIds: mocks.findVotableApartmentIds,
}));
vi.mock('@/lib/voting/queries/find-recent-vote-confirmation', () => ({
  findRecentVoteConfirmation: mocks.findRecent,
}));
vi.mock('@/lib/voting/mutations/save-vote-confirmation', () => ({
  saveVoteConfirmation: mocks.saveVoteConfirmation,
}));
vi.mock('@/lib/voting/mutations/delete-vote-confirmation', () => ({
  deleteVoteConfirmation: mocks.deleteVoteConfirmation,
}));
vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: mocks.findUserById,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({ sendVoteConfirmationEmail: mocks.send }),
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const VOTING = {
  voting: {
    id: 'v1',
    title: 'Remont',
    hoa: { id: 'hoa-1' },
    questions: [{ id: 'q1' }, { id: 'q2' }],
  },
};
const ANSWERS = { q1: 'FOR', q2: 'AGAINST' };

describe('requestVoteConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveOpenVoting.mockResolvedValue(VOTING);
    mocks.findVotableApartmentIds.mockResolvedValue(['apt-1']);
    mocks.findRecent.mockResolvedValue(null);
    mocks.saveVoteConfirmation.mockResolvedValue('c1');
    mocks.findUserById.mockResolvedValue({
      email: 'jan@example.com',
      name: 'Jan',
    });
    mocks.send.mockResolvedValue({ ok: true, delivery: 'sent' });
  });

  it('stores a hashed token with the answers and emails the plain token', async () => {
    const result = await requestVoteConfirmation('user-1', 'v1', ANSWERS);

    expect(result).toMatchObject({ ok: true });
    const saved = mocks.saveVoteConfirmation.mock.calls[0][0];
    const [, token] = mocks.send.mock.calls[0];
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(saved).toMatchObject({
      votingId: 'v1',
      userId: 'user-1',
      answers: ANSWERS,
      tokenHash: hashConfirmationToken(token),
    });
    expect(saved.tokenHash).not.toContain(token);
    expect(mocks.send.mock.calls[0][0]).toBe('jan@example.com');
  });

  it('passes through the reason a tenant cannot vote', async () => {
    const failure = { ok: false, code: 'not-found', message: 'x' };
    mocks.resolveOpenVoting.mockResolvedValue({ failure });

    expect(await requestVoteConfirmation('user-1', 'v1', ANSWERS)).toBe(
      failure
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('rejects incomplete answers before sending anything', async () => {
    expect(
      await requestVoteConfirmation('user-1', 'v1', { q1: 'FOR' })
    ).toMatchObject({
      ok: false,
      message: 'Odpowiedz na wszystkie pytania',
    });
    expect(mocks.saveVoteConfirmation).not.toHaveBeenCalled();
  });

  it('rejects a user whose apartments have all voted', async () => {
    mocks.findVotableApartmentIds.mockResolvedValue([]);

    expect(
      await requestVoteConfirmation('user-1', 'v1', ANSWERS)
    ).toMatchObject({
      ok: false,
      code: 'invalid',
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('refuses a new link within the rate limit window and says how long to wait', async () => {
    mocks.findRecent.mockResolvedValue({
      createdAt: new Date(Date.now() - 60_000),
    });

    expect(await requestVoteConfirmation('user-1', 'v1', ANSWERS)).toEqual({
      ok: false,
      code: 'invalid',
      message: 'Poczekaj 4 min przed ponownym wysłaniem linku',
    });
    expect(mocks.saveVoteConfirmation).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('removes the pending ballot when the email cannot be sent', async () => {
    mocks.send.mockResolvedValue({ ok: false, reason: 'send-failed' });

    expect(
      await requestVoteConfirmation('user-1', 'v1', ANSWERS)
    ).toMatchObject({
      ok: false,
      code: 'failed',
    });
    expect(mocks.deleteVoteConfirmation).toHaveBeenCalledWith('c1');
  });
});
