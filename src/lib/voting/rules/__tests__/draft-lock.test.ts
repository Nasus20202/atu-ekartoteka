import { describe, expect, it } from 'vitest';

import { changesBallotContent } from '@/lib/voting/rules/draft-lock';

const CURRENT = {
  hoaId: 'h1',
  allowAbstain: true,
  questions: [{ text: 'A' }],
};
const INPUT = {
  ...CURRENT,
  title: 'T',
  description: null,
  endsAt: null,
};

describe('changesBallotContent', () => {
  it('lets the title, description and deadline change', () => {
    expect(
      changesBallotContent(CURRENT, {
        ...INPUT,
        title: 'Inny',
        description: 'Opis',
        endsAt: new Date(),
      })
    ).toBe(false);
  });

  it.each([
    ['the association', { hoaId: 'h2' }],
    ['abstaining', { allowAbstain: false }],
    ['a question', { questions: [{ text: 'B' }] }],
    ['the number of questions', { questions: [{ text: 'A' }, { text: 'B' }] }],
  ])('sees a change of %s', (_, change) => {
    expect(changesBallotContent(CURRENT, { ...INPUT, ...change })).toBe(true);
  });
});
