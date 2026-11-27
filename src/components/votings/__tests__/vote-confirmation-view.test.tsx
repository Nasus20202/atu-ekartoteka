import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VoteConfirmationView } from '@/components/votings/vote-confirmation-view';
import { generateConfirmationToken } from '@/lib/voting/rules/confirmation-token';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findByToken: vi.fn(),
  findTenantVoting: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireApprovedTenant,
}));
vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));
vi.mock('@/lib/voting/queries/find-vote-confirmation', () => ({
  findVoteConfirmationByToken: mocks.findByToken,
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVoting: mocks.findTenantVoting,
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
    answers: { q1: 'FOR' },
    expiresAt: new Date('2026-06-01T12:10:00Z'),
    ...overrides,
  };
}

async function show(token = TOKEN) {
  render(await VoteConfirmationView({ token }));
}

describe('VoteConfirmationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
    mocks.findByToken.mockResolvedValue(pending());
    mocks.findTenantVoting.mockResolvedValue({
      id: 'v1',
      title: 'Remont dachu',
      description: null,
      status: 'ACTIVE',
      endsAt: null,
      hoa: { id: 'h1', name: 'Lipowa' },
      questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
    });
  });

  it('asks the owner to confirm the stored answers', async () => {
    await show();

    expect(screen.getByText(`card Remont dachu ${TOKEN}`)).toBeVisible();
  });

  it('does not look anything up for a malformed token', async () => {
    await show('123456');

    expect(screen.getByText(UNUSABLE)).toBeVisible();
    expect(mocks.findByToken).not.toHaveBeenCalled();
  });

  it('treats an unknown, foreign or expired link the same way', async () => {
    mocks.findByToken.mockResolvedValue(null);
    await show();
    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });

  it("does not show another user's answers", async () => {
    mocks.findByToken.mockResolvedValue(pending({ userId: 'user-2' }));
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
    expect(mocks.findTenantVoting).not.toHaveBeenCalled();
  });

  it('refuses an expired link', async () => {
    mocks.findByToken.mockResolvedValue(
      pending({ expiresAt: new Date('2026-06-01T11:59:00Z') })
    );
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });

  it('refuses a voting that is closed or no longer visible', async () => {
    mocks.findTenantVoting.mockResolvedValueOnce(null);
    await show();
    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });

  it('refuses a voting whose deadline has passed', async () => {
    mocks.findTenantVoting.mockResolvedValue({
      id: 'v1',
      title: 'Remont dachu',
      description: null,
      status: 'ACTIVE',
      endsAt: new Date('2026-06-01T11:00:00Z'),
      hoa: { id: 'h1', name: 'Lipowa' },
      questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
    });
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });

  it('refuses stored answers that no longer fit the questions', async () => {
    mocks.findByToken.mockResolvedValue(pending({ answers: { other: 'FOR' } }));
    await show();

    expect(screen.getByText(UNUSABLE)).toBeVisible();
  });
});
