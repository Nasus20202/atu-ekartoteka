import { describe, expect, it } from 'vitest';

import { toEligibleVoterDto } from '@/lib/voting/dto/eligible-voter-dto';

describe('toEligibleVoterDto', () => {
  const source = {
    id: 'u1',
    name: 'Anna',
    email: 'anna@example.com',
    _count: { apartments: 2 },
    votingBallots: [{ id: 'b1' }],
  };

  it('marks a voter who has voted for only some apartments as not done', () => {
    expect(toEligibleVoterDto(source)).toMatchObject({
      name: 'Anna',
      apartmentCount: 2,
      hasVoted: false,
    });
  });

  it('marks a voter with a ballot per apartment as done', () => {
    expect(
      toEligibleVoterDto({
        ...source,
        votingBallots: [{ id: 'a' }, { id: 'b' }],
      }).hasVoted
    ).toBe(true);
  });

  it('shows the email when there is no name', () => {
    expect(toEligibleVoterDto({ ...source, name: null }).name).toBe(
      'anna@example.com'
    );
  });
});
