import { beforeEach, describe, expect, it } from 'vitest';

import {
  mocks,
  ONE,
  primeRequestMocks,
} from '@/__tests__/helpers/voting/request-confirmation-mocks';
import { requestVoteConfirmation } from '@/lib/voting/use-cases/request-vote-confirmation';

describe('requestVoteConfirmation: ballots', () => {
  beforeEach(primeRequestMocks);

  it('emails the answers of each answered apartment in words', async () => {
    await requestVoteConfirmation('user-1', 'v1', {
      'apt-2': { q1: 'AGAINST', q2: 'ABSTAIN' },
    });

    expect(mocks.send.mock.calls[0][3]).toEqual([
      {
        apartment: 'Lipowa 1/2',
        answers: [
          { question: 'Dach?', answer: 'Przeciw' },
          { question: 'Firma A?', answer: 'Wstrzymał(a) się' },
        ],
      },
    ]);
  });

  it.each([
    [{}, /co najmniej jednego lokalu/],
    [{ foreign: ONE }, /nie można oddać głosu/],
    [{ 'apt-1': ONE, 'apt-2': { q1: 'FOR' } }, /wszystkie pytania/],
  ])('rejects the ballots %j', async (answers, message) => {
    expect(
      await requestVoteConfirmation('user-1', 'v1', answers)
    ).toMatchObject({ message: expect.stringMatching(message) });
    expect(mocks.saveVoteConfirmation).not.toHaveBeenCalled();
  });
});
