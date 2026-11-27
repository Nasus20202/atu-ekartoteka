import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VoteConfirmationLoader } from '@/app/dashboard/votings/confirm/[token]/vote-confirmation-loader';
import { generateConfirmationToken } from '@/lib/voting/rules/confirmation-token';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findByToken: vi.fn(),
  findUserById: vi.fn(),
  findTenantVoting: vi.fn(),
  deleteConfirmation: vi.fn(),
  recordConfirmation: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireApprovedTenant,
}));
vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));
vi.mock('@/lib/platform/opentelemetry/voting-metrics', () => ({
  votingMetrics: { recordConfirmation: mocks.recordConfirmation },
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
vi.mock('@/components/votings/confirm-vote-card', () => ({
  ConfirmVoteCard: (props: { votingTitle: string; token: string }) => (
    <div>
      card {props.votingTitle} {props.token}
    </div>
  ),
}));

const TOKEN = generateConfirmationToken();
const UNUSABLE = /Ten link jest nieprawidłowy/;

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

function voting(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    title: 'Remont dachu',
    description: null,
    status: 'ACTIVE',
    endsAt: null,
    hoa: { id: 'h1', name: 'Lipowa' },
    questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
    ...overrides,
  };
}

async function show(token: string = TOKEN) {
  render(await VoteConfirmationLoader({ token }));
}

describe('VoteConfirmationLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
    mocks.findByToken.mockResolvedValue(pending());
    mocks.findUserById.mockResolvedValue({ status: 'APPROVED' });
    mocks.findTenantVoting.mockResolvedValue(voting());
  });

  it('asks the owner to confirm the stored answers', async () => {
    await show();

    expect(screen.getByText(`card Remont dachu ${TOKEN}`)).toBeVisible();
    expect(mocks.recordConfirmation).not.toHaveBeenCalled();
  });

  it('does not look anything up for a malformed token', async () => {
    await show('123456');

    expect(screen.getByText(UNUSABLE)).toBeVisible();
    expect(mocks.findByToken).not.toHaveBeenCalled();
  });

  it("does not show another user's answers", async () => {
    mocks.findByToken.mockResolvedValue(pending({ userId: 'user-2' }));
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
    expect(mocks.findTenantVoting).not.toHaveBeenCalled();
  });

  it('refuses a voting whose deadline has passed', async () => {
    mocks.findTenantVoting.mockResolvedValue(
      voting({ endsAt: new Date('2026-06-01T11:00:00Z') })
    );
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });

  it('refuses stored answers that no longer fit the questions', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ answers: { 'apt-1': { other: 'FOR' } } })
    );
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });

  it('shows an expired link without removing it', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ expiresAt: new Date('2026-06-01T11:59:00Z') })
    );
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
    expect(mocks.deleteConfirmation).not.toHaveBeenCalled();
  });

  describe('metrics for opened links', () => {
    it.each([
      ['a malformed token', '123456', null, 'invalid_link'],
      ['an unknown or used link', TOKEN, null, 'invalid_link'],
      ['a foreign link', TOKEN, pending({ userId: 'user-2' }), 'foreign_link'],
      [
        'an expired link',
        TOKEN,
        pending({ expiresAt: new Date('2026-06-01T11:59:00Z') }),
        'expired',
      ],
      [
        'stored answers that do not fit',
        TOKEN,
        pending({ answers: { 'apt-1': { x: 'FOR' } } }),
        'invalid_link',
      ],
    ])('counts %s as rejected', async (_label, token, row, reason) => {
      mocks.findByToken.mockResolvedValue(row);
      await show(token);

      expect(mocks.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason,
      });
    });

    it('counts a voting that is no longer visible as closed', async () => {
      mocks.findTenantVoting.mockResolvedValue(null);
      await show();

      expect(mocks.recordConfirmation).toHaveBeenCalledWith({
        result: 'rejected',
        reason: 'closed',
      });
    });

    it('does not count an account without access to votings', async () => {
      mocks.findUserById.mockResolvedValue({ status: 'PENDING' });
      await show();

      expect(screen.getByText(UNUSABLE)).toBeVisible();
      expect(mocks.recordConfirmation).not.toHaveBeenCalled();
    });
  });
});
