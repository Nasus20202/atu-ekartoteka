import { describe, expect, it } from 'vitest';

import {
  awaitingVotesSentence,
  savedVoteSentence,
} from '@/lib/voting/rules/voting-wording';

describe('voting sentences', () => {
  it.each([
    [1, '1 głosowanie czeka na Twój głos'],
    [3, '3 głosowania czekają na Twój głos'],
    [5, '5 głosowań czeka na Twój głos'],
    [22, '22 głosowania czekają na Twój głos'],
  ])('counts %i waiting votings', (count, sentence) => {
    expect(awaitingVotesSentence(count)).toBe(sentence);
  });

  it.each([
    [1, 'Zapisaliśmy Twój głos dla 1 lokalu.'],
    [2, 'Zapisaliśmy Twój głos dla 2 lokali.'],
    [5, 'Zapisaliśmy Twój głos dla 5 lokali.'],
  ])('confirms a vote for %i apartments', (count, sentence) => {
    expect(savedVoteSentence(count)).toBe(sentence);
  });
});
