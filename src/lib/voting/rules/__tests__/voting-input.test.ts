import { describe, expect, it } from 'vitest';

import {
  parseAnswers,
  parseVotingInput,
} from '@/lib/voting/rules/voting-input';

const valid = {
  hoaId: 'hoa-1',
  title: '  Remont dachu ',
  description: ' Opis ',
  endsAt: '2026-12-31T10:00:00.000Z',
  questions: [{ text: ' Czy zgadzasz się? ' }, { text: 'Drugie' }],
};

describe('parseVotingInput', () => {
  it('trims fields and keeps the question order', () => {
    const result = parseVotingInput(valid);

    expect(result).toEqual({
      ok: true,
      value: {
        hoaId: 'hoa-1',
        title: 'Remont dachu',
        description: 'Opis',
        endsAt: new Date('2026-12-31T10:00:00.000Z'),
        questions: [{ text: 'Czy zgadzasz się?' }, { text: 'Drugie' }],
      },
    });
  });

  it('treats an empty description and deadline as none', () => {
    const result = parseVotingInput({ ...valid, description: ' ', endsAt: '' });

    expect(result).toMatchObject({
      ok: true,
      value: { description: null, endsAt: null },
    });
  });

  it.each([
    [{ ...valid, hoaId: undefined }, 'Wybierz wspólnotę'],
    [{ ...valid, title: '  ' }, 'Podaj tytuł głosowania'],
    [
      { ...valid, title: 'x'.repeat(201) },
      'Tytuł może mieć maksymalnie 200 znaków',
    ],
    [{ ...valid, endsAt: 'jutro' }, 'Nieprawidłowy termin głosowania'],
    [{ ...valid, questions: [] }, 'Dodaj co najmniej jedno pytanie'],
    [
      { ...valid, questions: [{ text: ' ' }] },
      'Treść pytania nie może być pusta',
    ],
    [
      {
        ...valid,
        questions: Array.from({ length: 21 }, () => ({ text: 'a' })),
      },
      'Głosowanie może mieć maksymalnie 20 pytań',
    ],
    [null, 'Wybierz wspólnotę'],
  ])('rejects %#', (input, message) => {
    expect(parseVotingInput(input)).toEqual({ ok: false, message });
  });
});

describe('parseAnswers', () => {
  const ids = ['q1', 'q2'];

  it('accepts exactly one valid choice per question', () => {
    expect(parseAnswers({ q1: 'FOR', q2: 'ABSTAIN' }, ids)).toEqual({
      ok: true,
      value: { q1: 'FOR', q2: 'ABSTAIN' },
    });
  });

  it.each([
    [{ q1: 'FOR' }],
    [{ q1: 'FOR', q2: 'MAYBE' }],
    [{ q1: 'FOR', q2: 'AGAINST', q3: 'FOR' }],
    [{ q1: 'FOR', other: 'FOR' }],
    ['FOR'],
    [null],
  ])('rejects %j', (input) => {
    expect(parseAnswers(input, ids)).toEqual({
      ok: false,
      message: 'Odpowiedz na wszystkie pytania',
    });
  });
});
