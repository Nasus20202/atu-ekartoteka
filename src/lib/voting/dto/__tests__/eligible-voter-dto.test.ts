import { describe, expect, it } from 'vitest';

import { toEligibleVoterDto } from '@/lib/voting/dto/eligible-voter-dto';

const apartment = (number: string, voted: boolean) => ({
  id: `a${number}`,
  owner: 'Anna i Jan',
  address: 'Lipowa',
  building: '1',
  number,
  votingBallots: voted ? [{ id: `b${number}` }] : [],
});

describe('toEligibleVoterDto', () => {
  const source = {
    id: 'u1',
    name: 'Anna',
    email: 'anna@example.com',
    apartments: [apartment('2', true), apartment('3', false)],
  };

  it('lists every apartment with its owner', () => {
    expect(toEligibleVoterDto(source).apartments).toEqual([
      { id: 'a2', label: 'Lipowa 1/2 – Anna i Jan' },
      { id: 'a3', label: 'Lipowa 1/3 – Anna i Jan' },
    ]);
  });

  it('marks a voter who has voted for only some apartments as not done', () => {
    expect(toEligibleVoterDto(source)).toMatchObject({
      name: 'Anna',
      hasVoted: false,
    });
  });

  it('marks a voter with a ballot per apartment as done', () => {
    expect(
      toEligibleVoterDto({ ...source, apartments: [apartment('2', true)] })
        .hasVoted
    ).toBe(true);
  });

  it('shows the email when there is no name', () => {
    expect(toEligibleVoterDto({ ...source, name: null }).name).toBe(
      'anna@example.com'
    );
  });
});
