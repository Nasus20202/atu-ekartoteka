/**
 * Votings for the visual regression database, with fixed ids and dates: a
 * draft, an active one in which one of the two apartments of the multi-apartment
 * tenant has voted, and one whose results are published.
 */

import type * as pg from 'pg';

import { loadSql } from './load-sql';

export const VISUAL_VOTING_ACTIVE = 'visual-voting-active';
export const VISUAL_VOTING_RESULTS = 'visual-voting-results';
export const VISUAL_VOTING_DRAFT = 'visual-voting-draft';

type Choice = 'FOR' | 'AGAINST' | 'ABSTAIN';

interface VisualVoting {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'RESULTS_PUBLISHED';
  endsAt: string | null;
  createdAt: string;
  questions: string[];
}

const VOTINGS: VisualVoting[] = [
  {
    id: VISUAL_VOTING_ACTIVE,
    title: 'Uchwała w sprawie remontu dachu',
    description:
      'Głosowanie nad zakresem i wykonawcą remontu dachu budynku przy ul. Testowej.',
    status: 'ACTIVE',
    endsAt: '2025-01-31T11:00:00Z',
    createdAt: '2024-12-03T09:00:00Z',
    questions: [
      'Czy wyrażasz zgodę na remont dachu w 2025 roku?',
      'Czy wybieramy firmę Dachy-Test jako wykonawcę?',
    ],
  },
  {
    id: VISUAL_VOTING_RESULTS,
    title: 'Uchwała w sprawie funduszu remontowego',
    description: null,
    status: 'RESULTS_PUBLISHED',
    endsAt: null,
    createdAt: '2024-11-20T09:00:00Z',
    questions: [
      'Czy podnosimy stawkę funduszu remontowego o 0,50 zł za m²?',
      'Czy przeznaczamy nadwyżkę na remont klatek schodowych?',
    ],
  },
  {
    id: VISUAL_VOTING_DRAFT,
    title: 'Uchwała w sprawie monitoringu',
    description: 'Projekt do konsultacji z zarządem.',
    status: 'DRAFT',
    endsAt: null,
    createdAt: '2024-12-10T09:00:00Z',
    questions: ['Czy instalujemy kamery przy wejściach do budynku?'],
  },
];

// Answers per apartment number of the test HOA, for the results voting
const RESULT_ANSWERS: Record<string, Choice[]> = {
  '1': ['FOR', 'FOR'],
  '5': ['FOR', 'AGAINST'],
  '6': ['AGAINST', 'ABSTAIN'],
};
const ACTIVE_ANSWERS: Record<string, Choice[]> = { '5': ['FOR', 'FOR'] };

const BALLOT_TIME = '2024-12-05T10:00:00Z';

async function seedBallots(
  client: pg.Client,
  voting: VisualVoting,
  answers: Record<string, Choice[]>,
  apartments: { id: string; userId: string; number: string }[]
) {
  for (const apartment of apartments) {
    const choices = answers[apartment.number];
    if (!choices) continue;

    const ballotId = `${voting.id}-ballot-${apartment.number}`;
    await client.query(loadSql('insert-visual-voting-ballot.sql'), [
      ballotId,
      voting.id,
      apartment.id,
      apartment.userId,
      BALLOT_TIME,
    ]);
    for (const [index, choice] of choices.entries()) {
      await client.query(loadSql('insert-visual-voting-vote.sql'), [
        `${ballotId}-${index}`,
        ballotId,
        `${voting.id}-q${index}`,
        choice,
      ]);
    }
  }
}

export async function seedVisualVotings(client: pg.Client, hoaId: string) {
  const apartments = (
    await client.query<{ id: string; userId: string; number: string }>(
      loadSql('select-visual-voter-apartments.sql'),
      [hoaId]
    )
  ).rows;

  for (const voting of VOTINGS) {
    await client.query(loadSql('insert-visual-voting.sql'), [
      voting.id,
      hoaId,
      voting.title,
      voting.description,
      voting.status,
      voting.endsAt,
      voting.createdAt,
    ]);
    for (const [index, text] of voting.questions.entries()) {
      await client.query(loadSql('insert-visual-voting-question.sql'), [
        `${voting.id}-q${index}`,
        voting.id,
        index,
        text,
      ]);
    }
  }

  await seedBallots(client, VOTINGS[1], RESULT_ANSWERS, apartments);
  await seedBallots(client, VOTINGS[0], ACTIVE_ANSWERS, apartments);
}
