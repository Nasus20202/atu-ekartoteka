import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateConfirmationToken } from '@/lib/voting/rules/confirmation-token';
import { resolveVoteLink } from '@/lib/voting/use-cases/resolve-vote-link';

const mocks = vi.hoisted(() => ({ findByToken: vi.fn() }));

vi.mock('@/lib/voting/queries/find-vote-confirmation', () => ({
  findVoteConfirmationByToken: mocks.findByToken,
}));
vi.mock('@/lib/voting/queries/find-voter-apartments', () => ({
  findOwnedApartments: async (_user: string, _hoa: string, ids: string[]) =>
    ids
      .filter((id) => id === 'a1')
      .map((id) => ({ id, address: 'Lipowa', building: '1', number: '1' })),
}));
vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: async () => ({ status: 'APPROVED' }),
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVoting: async () => ({
    id: 'v1',
    title: 'Remont dachu',
    description: null,
    status: 'ACTIVE',
    endsAt: null,
    allowAbstain: false,
    hoa: { id: 'h1', name: 'Lipowa' },
    questions: [{ id: 'q1', position: 0, text: 'Czy zgadzasz się?' }],
  }),
}));

function resolve(answers: unknown) {
  mocks.findByToken.mockResolvedValue({
    id: 'c1',
    votingId: 'v1',
    userId: 'user-1',
    answers,
    expiresAt: new Date('2026-06-01T12:10:00Z'),
  });

  return resolveVoteLink({
    userId: 'user-1',
    token: generateConfirmationToken(),
    now: new Date('2026-06-01T12:00:00Z'),
  });
}

describe('resolveVoteLink accepted ballots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('leaves out an apartment the user no longer owns', async () => {
    expect(
      await resolve({ a1: { q1: 'FOR' }, sold: { q1: 'AGAINST' } })
    ).toMatchObject({
      ok: true,
      link: { answers: { a1: { q1: 'FOR' } } },
    });
  });

  it.each([
    ['an abstention in a voting that blocks it', { a1: { q1: 'ABSTAIN' } }],
    ['no ballot of an own apartment', { sold: { q1: 'FOR' } }],
    ['something other than ballots', 'text'],
    ['nothing', null],
  ])('refuses a link that stores %s', async (_label, answers) => {
    expect(await resolve(answers)).toMatchObject({
      ok: false,
      rejection: { reason: 'unreadable-answers' },
    });
  });
});
