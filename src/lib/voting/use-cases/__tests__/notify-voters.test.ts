import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notifyVoters } from '@/lib/voting/use-cases/notify-voters';

const mocks = vi.hoisted(() => ({
  findVotingById: vi.fn(),
  findEligibleRecipients: vi.fn(),
  send: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/voting/queries/find-voting-by-id', () => ({
  findVotingById: mocks.findVotingById,
}));
vi.mock('@/lib/voting/queries/find-eligible-voters', () => ({
  findEligibleRecipients: mocks.findEligibleRecipients,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({ sendVotingNotificationEmail: mocks.send }),
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mocks.log,
}));

const ACTIVE = {
  id: 'v1',
  title: 'Remont',
  status: 'ACTIVE',
  endsAt: null,
  hoa: { id: 'hoa-1', name: 'Wspólnota' },
};

describe('notifyVoters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findVotingById.mockResolvedValue(ACTIVE);
    mocks.send.mockResolvedValue({ ok: true, delivery: 'sent' });
  });

  it('emails only the recipients that are eligible', async () => {
    mocks.findEligibleRecipients.mockResolvedValue([
      { id: 'u1', name: 'Jan', email: 'jan@example.com' },
    ]);

    const result = await notifyVoters('admin-1', 'v1', ['u1', 'forged', 'u1']);

    expect(result).toEqual({ ok: true, data: { sent: 1, failed: 0 } });
    expect(mocks.findEligibleRecipients).toHaveBeenCalledWith('hoa-1', [
      'u1',
      'forged',
    ]);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(
      'jan@example.com',
      'v1',
      'Remont',
      'Wspólnota',
      undefined,
      'Jan'
    );
  });

  it('counts failed sends', async () => {
    mocks.findEligibleRecipients.mockResolvedValue([
      { id: 'u1', name: null, email: 'a@example.com' },
      { id: 'u2', name: null, email: 'b@example.com' },
    ]);
    mocks.send
      .mockResolvedValueOnce({ ok: true, delivery: 'sent' })
      .mockResolvedValueOnce({ ok: false, reason: 'send-failed' });

    expect(await notifyVoters('admin-1', 'v1', ['u1', 'u2'])).toEqual({
      ok: true,
      data: { sent: 1, failed: 1 },
    });
  });

  it('refuses a voting that is not open', async () => {
    mocks.findVotingById.mockResolvedValue({ ...ACTIVE, status: 'DRAFT' });

    expect(await notifyVoters('admin-1', 'v1', ['u1'])).toMatchObject({
      ok: false,
      code: 'invalid',
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it.each([[undefined], [[]], [[1]], ['u1']])(
    'rejects recipients %j',
    async (ids) => {
      expect(await notifyVoters('admin-1', 'v1', ids)).toMatchObject({
        ok: false,
        code: 'invalid',
      });
    }
  );

  it('logs ids and counts, not addresses', async () => {
    mocks.findEligibleRecipients.mockResolvedValue([
      { id: 'u1', name: 'Jan', email: 'jan@example.com' },
    ]);

    await notifyVoters('admin-1', 'v1', ['u1']);

    expect(JSON.stringify(mocks.log.info.mock.calls)).not.toContain(
      'jan@example.com'
    );
  });
});
