import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countVotingApartments } from '@/lib/voting/queries/count-voting-apartments';
import { findMeetingBallotApartments } from '@/lib/voting/queries/find-meeting-ballot-apartments';

const db = vi.hoisted(() => ({
  apartment: { findMany: vi.fn(), count: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

describe('meeting ballot queries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('offers a limited list of active apartments without a ballot', async () => {
    await findMeetingBallotApartments('v1', '');

    expect(db.apartment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          homeownersAssociation: { votings: { some: { id: 'v1' } } },
          votingBallots: { none: { votingId: 'v1' } },
          AND: [],
        },
        take: 50,
      })
    );
  });

  it('looks for every word in the owner and the address', async () => {
    await findMeetingBallotApartments('v1', ' Kowal 1/2 ');

    const { AND } = db.apartment.findMany.mock.calls[0][0].where;
    expect(AND).toHaveLength(3);
    expect(AND[0].OR).toContainEqual({
      owner: { contains: 'Kowal', mode: 'insensitive' },
    });
    expect(AND[2].OR).toContainEqual({
      number: { contains: '2', mode: 'insensitive' },
    });
  });

  it('counts every active apartment of the association', async () => {
    db.apartment.count.mockResolvedValue(20);

    expect(await countVotingApartments('h1')).toBe(20);
    expect(db.apartment.count).toHaveBeenCalledWith({
      where: { homeownersAssociationId: 'h1', isActive: true },
    });
  });
});
