import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ voting: { findMany: vi.fn() } }));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import { findAdminVotings } from '@/lib/voting/queries/find-admin-votings';
import type { VotingSortKey } from '@/lib/voting/rules/voting-list-query';

describe('findAdminVotings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filters and orders in the database', async () => {
    await findAdminVotings({
      hoaId: 'h1',
      status: 'ACTIVE',
      sort: { key: 'ballots', direction: 'asc' },
    });

    expect(db.voting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hoaId: 'h1', status: 'ACTIVE' },
        orderBy: [
          { ballots: { _count: 'asc' } },
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
      })
    );
  });

  it.each<[VotingSortKey, object]>([
    ['title', { title: 'desc' }],
    ['hoa', { hoa: { name: 'desc' } }],
    ['status', { status: 'desc' }],
    ['questions', { questions: { _count: 'desc' } }],
    ['endsAt', { endsAt: { sort: 'desc', nulls: 'last' } }],
  ])('orders by %s, then by the newest', async (key, orderBy) => {
    await findAdminVotings({
      hoaId: null,
      status: null,
      sort: { key, direction: 'desc' },
    });

    expect(db.voting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [orderBy, { createdAt: 'desc' }, { id: 'asc' }],
      })
    );
  });
});
