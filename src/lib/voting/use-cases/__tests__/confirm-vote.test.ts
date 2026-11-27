import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hashConfirmationCode } from '@/lib/voting/rules/confirmation-code';
import { confirmVote } from '@/lib/voting/use-cases/confirm-vote';

const mocks = vi.hoisted(() => ({
  resolveOpenVoting: vi.fn(),
  findVoteConfirmation: vi.fn(),
  registerAttempt: vi.fn(),
  deleteConfirmation: vi.fn(),
  castBallots: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/voting/use-cases/vote-access', () => ({
  resolveOpenVoting: mocks.resolveOpenVoting,
  VOTING_ENDED: 'Głosowanie zostało zakończone',
}));
vi.mock('@/lib/voting/queries/find-vote-confirmation', () => ({
  findVoteConfirmation: mocks.findVoteConfirmation,
}));
vi.mock('@/lib/voting/mutations/vote-confirmation-attempts', () => ({
  registerConfirmationAttempt: mocks.registerAttempt,
  deleteVoteConfirmation: mocks.deleteConfirmation,
}));
vi.mock('@/lib/voting/mutations/cast-ballots', () => ({
  castBallots: mocks.castBallots,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mocks.log,
}));

const CODE = '123456';
const ANSWERS = { q1: 'FOR' };

function pending(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    codeHash: hashConfirmationCode('c1', CODE),
    answers: ANSWERS,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

describe('confirmVote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveOpenVoting.mockResolvedValue({
      voting: { id: 'v1', hoa: { id: 'hoa-1' }, questions: [{ id: 'q1' }] },
    });
    mocks.findVoteConfirmation.mockResolvedValue(pending());
    mocks.registerAttempt.mockResolvedValue(1);
    mocks.castBallots.mockResolvedValue({ ok: true, ballots: 2 });
  });

  it('casts the ballots when the code is right', async () => {
    expect(await confirmVote('user-1', 'v1', CODE)).toEqual({
      ok: true,
      data: { ballots: 2 },
    });
    expect(mocks.castBallots).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmationId: 'c1',
        votingId: 'v1',
        hoaId: 'hoa-1',
        userId: 'user-1',
        answers: ANSWERS,
      })
    );
  });

  it('rejects a malformed code without touching the database', async () => {
    expect(await confirmVote('user-1', 'v1', '12ab')).toMatchObject({
      message: 'Nieprawidłowy kod',
    });
    expect(mocks.findVoteConfirmation).not.toHaveBeenCalled();
  });

  it('counts a wrong code and keeps the confirmation until the limit', async () => {
    expect(await confirmVote('user-1', 'v1', '000000')).toMatchObject({
      message: 'Nieprawidłowy kod',
    });
    expect(mocks.castBallots).not.toHaveBeenCalled();
    expect(mocks.deleteConfirmation).not.toHaveBeenCalled();
  });

  it('locks the code on the fifth wrong attempt but keeps it for the rate limit', async () => {
    mocks.registerAttempt.mockResolvedValue(5);

    expect(await confirmVote('user-1', 'v1', '000000')).toMatchObject({
      message: expect.stringContaining('Przekroczono'),
    });
    expect(mocks.deleteConfirmation).not.toHaveBeenCalled();
  });

  it('refuses even the right code after the attempts are used up', async () => {
    mocks.registerAttempt.mockResolvedValue(6);

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      ok: false,
    });
    expect(mocks.castBallots).not.toHaveBeenCalled();
  });

  it('rejects an expired code and removes it', async () => {
    mocks.findVoteConfirmation.mockResolvedValue(
      pending({ expiresAt: new Date(Date.now() - 1) })
    );

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      ok: false,
    });
    expect(mocks.deleteConfirmation).toHaveBeenCalledWith('c1');
    expect(mocks.castBallots).not.toHaveBeenCalled();
  });

  it('rejects when nothing is pending, e.g. a used code', async () => {
    mocks.findVoteConfirmation.mockResolvedValue(null);

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      ok: false,
    });
  });

  it('passes through a closed voting', async () => {
    const failure = {
      ok: false,
      code: 'invalid',
      message: 'Głosowanie zostało zakończone',
    };
    mocks.resolveOpenVoting.mockResolvedValue({ failure });

    expect(await confirmVote('user-1', 'v1', CODE)).toBe(failure);
  });

  it.each([
    ['closed', 'Głosowanie zostało zakończone'],
    ['consumed', 'Kod wygasł lub został już użyty. Poproś o nowy'],
    ['nothing-to-vote', 'Oddano już głosy za wszystkie Twoje lokale'],
  ])('maps the %s outcome of the transaction', async (reason, message) => {
    mocks.castBallots.mockResolvedValue({ ok: false, reason });

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      ok: false,
      message,
    });
  });

  it('drops a stored ballot whose answers no longer fit the questions', async () => {
    mocks.findVoteConfirmation.mockResolvedValue(
      pending({ answers: { other: 'FOR' } })
    );

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      ok: false,
    });
    expect(mocks.deleteConfirmation).toHaveBeenCalledWith('c1');
    expect(mocks.castBallots).not.toHaveBeenCalled();
  });

  it('treats a confirmation deleted meanwhile as expired', async () => {
    mocks.registerAttempt.mockResolvedValue(null);

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      message: 'Kod wygasł lub został już użyty. Poproś o nowy',
    });
  });

  it('reports a duplicate as a failure', async () => {
    mocks.castBallots.mockResolvedValue({ ok: false, reason: 'duplicate' });

    expect(await confirmVote('user-1', 'v1', CODE)).toMatchObject({
      ok: false,
      code: 'failed',
    });
  });

  it('never logs the code or the answers', async () => {
    await confirmVote('user-1', 'v1', '000000');
    await confirmVote('user-1', 'v1', CODE);

    const logged = JSON.stringify([
      ...mocks.log.info.mock.calls,
      ...mocks.log.warn.mock.calls,
    ]);
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain('FOR');
  });
});
