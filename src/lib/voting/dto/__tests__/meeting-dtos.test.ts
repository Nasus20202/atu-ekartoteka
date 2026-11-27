import { describe, expect, it } from 'vitest';

import { toMeetingApartmentDto } from '@/lib/voting/dto/meeting-apartment-dto';
import { toOwnBallotDto } from '@/lib/voting/dto/own-ballot-dto';
import { toVoterDto } from '@/lib/voting/dto/voting-dto';

const apartment = { address: 'Lipowa', building: '1', number: '2' };
const ballot = (id: string, userId: string | null) => ({
  id,
  userId,
  apartment,
  votes: [{ questionId: 'q1', choice: 'FOR' as const }],
});

describe('meeting ballot DTOs', () => {
  it.each([
    ['Anna', 'Lipowa 1/2 – Anna'],
    [null, 'Lipowa 1/2'],
  ])('labels an apartment with the owner %s', (owner, label) => {
    expect(toMeetingApartmentDto({ id: 'a', owner, ...apartment })).toEqual({
      id: 'a',
      label,
    });
  });

  it.each([
    ['u1', false],
    [null, true],
  ])('labels the apartment of a ballot cast by %s', (userId, fromMeeting) => {
    expect(toOwnBallotDto(ballot('b1', userId))).toEqual({
      id: 'b1',
      apartment: 'Lipowa 1/2',
      fromMeeting,
      answers: { q1: 'FOR' },
    });
  });

  it.each([
    ['Anna', 'Anna'],
    [null, 'Brak danych o właścicielu'],
  ])('names a meeting voter after the owner %s', (owner, name) => {
    const dto = toVoterDto({
      id: 'b',
      createdAt: new Date(),
      user: null,
      apartment: { owner, ...apartment },
      votes: [],
    });

    expect(dto).toMatchObject({
      voterName: name,
      voterEmail: null,
      fromMeeting: true,
    });
    expect(dto.apartment).toEqual(apartment);
  });
});
