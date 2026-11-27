import {
  MAX_DESCRIPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_QUESTIONS,
  MAX_TITLE_LENGTH,
} from '@/lib/voting/rules/voting-constants';
import type {
  BallotAnswers,
  VoteAnswers,
  VoteChoice,
  VotingInput,
} from '@/lib/voting/types/voting';

export type ParseResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

const fail = (message: string): { ok: false; message: string } => ({
  ok: false,
  message,
});

const asObject = (raw: unknown): Record<string, unknown> =>
  typeof raw === 'object' && raw !== null
    ? (raw as Record<string, unknown>)
    : {};

function parseDeadline(raw: unknown): ParseResult<Date | null> {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: null };
  }

  const date = typeof raw === 'string' ? new Date(raw) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return fail('Nieprawidłowy termin głosowania');
  }

  return { ok: true, value: date };
}

function parseQuestions(raw: unknown): ParseResult<{ text: string }[]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fail('Dodaj co najmniej jedno pytanie');
  }

  if (raw.length > MAX_QUESTIONS) {
    return fail(`Głosowanie może mieć maksymalnie ${MAX_QUESTIONS} pytań`);
  }

  const questions: { text: string }[] = [];

  for (const item of raw) {
    const text =
      typeof asObject(item).text === 'string'
        ? String(asObject(item).text).trim()
        : '';

    if (!text) return fail('Treść pytania nie może być pusta');
    if (text.length > MAX_QUESTION_LENGTH) {
      return fail(
        `Pytanie może mieć maksymalnie ${MAX_QUESTION_LENGTH} znaków`
      );
    }

    questions.push({ text });
  }

  return { ok: true, value: questions };
}

/** Validates a voting as the browser sent it; the order of checks decides the message. */
export function parseVotingInput(raw: unknown): ParseResult<VotingInput> {
  const fields = asObject(raw);
  const title = typeof fields.title === 'string' ? fields.title.trim() : '';
  const description =
    typeof fields.description === 'string' ? fields.description.trim() : '';

  if (typeof fields.hoaId !== 'string' || !fields.hoaId) {
    return fail('Wybierz wspólnotę');
  }
  if (!title) return fail('Podaj tytuł głosowania');
  if (title.length > MAX_TITLE_LENGTH) {
    return fail(`Tytuł może mieć maksymalnie ${MAX_TITLE_LENGTH} znaków`);
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return fail(`Opis może mieć maksymalnie ${MAX_DESCRIPTION_LENGTH} znaków`);
  }

  const endsAt = parseDeadline(fields.endsAt);
  if (!endsAt.ok) return endsAt;

  const questions = parseQuestions(fields.questions);
  if (!questions.ok) return questions;

  return {
    ok: true,
    value: {
      hoaId: fields.hoaId,
      title,
      description: description || null,
      endsAt: endsAt.value,
      // Abstaining is blocked only when the admin asks for it
      allowAbstain: fields.allowAbstain !== false,
      questions: questions.value,
    },
  };
}

/** Exactly one accepted choice for every question of the voting, and nothing else. */
export function parseAnswers(
  raw: unknown,
  questionIds: string[],
  choices: VoteChoice[]
): ParseResult<VoteAnswers> {
  const fields = asObject(raw);
  const keys = Object.keys(fields);
  const answers: VoteAnswers = {};

  const complete =
    keys.length === questionIds.length &&
    questionIds.every((id) => choices.includes(fields[id] as VoteChoice));

  if (!complete) return fail('Odpowiedz na wszystkie pytania');

  for (const id of questionIds) {
    answers[id] = fields[id] as VoteAnswers[string];
  }

  return { ok: true, value: answers };
}

/**
 * Complete answers for at least one of the apartments that may vote; the others
 * may vote later.
 */
export function parseBallotAnswers(
  raw: unknown,
  apartmentIds: string[],
  questionIds: string[],
  choices: VoteChoice[]
): ParseResult<BallotAnswers> {
  const entries = Object.entries(asObject(raw));
  if (entries.length === 0) {
    return fail(
      'Odpowiedz na wszystkie pytania dla co najmniej jednego lokalu'
    );
  }

  const ballots: BallotAnswers = {};

  for (const [apartmentId, rawAnswers] of entries) {
    if (!apartmentIds.includes(apartmentId)) {
      return fail(
        'Za wybrany lokal nie można oddać głosu. Odśwież stronę i spróbuj ponownie'
      );
    }
    const answers = parseAnswers(rawAnswers, questionIds, choices);
    if (!answers.ok) return answers;
    ballots[apartmentId] = answers.value;
  }

  return { ok: true, value: ballots };
}
