/**
 * Writes a voting and online ballots straight to the database, for specs about
 * what owners and admins see afterwards. Casting a vote online needs the emailed
 * link, which the integrations specs cover.
 */

import * as pg from 'pg';

import { loadSql } from './load-sql';
import type { VotingHoa } from './voting-hoa';

type Choice = 'FOR' | 'AGAINST' | 'ABSTAIN';

export interface SeededVoting {
  title: string;
  questions: string[];
  status?: 'ACTIVE' | 'CLOSED';
}

const questionId = (votingId: string, index: number) => `${votingId}-q${index}`;

async function withClient<T>(work: (client: pg.Client) => Promise<T>) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Returns the id of the voting. */
export function seedVoting(
  { hoaId }: VotingHoa,
  { title, questions, status = 'ACTIVE' }: SeededVoting
): Promise<string> {
  const id = `e2e-voting-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return withClient(async (client) => {
    await client.query(loadSql('insert-voting.sql'), [
      id,
      hoaId,
      title,
      null,
      status,
      null,
      new Date(),
    ]);
    for (const [index, text] of questions.entries()) {
      await client.query(loadSql('insert-voting-question.sql'), [
        questionId(id, index),
        id,
        index,
        text,
      ]);
    }
    return id;
  });
}

/** The vote one apartment cast online, with its answers in question order. */
export function seedOnlineBallot(
  { hoaId }: VotingHoa,
  votingId: string,
  apartmentNumber: string,
  choices: Choice[]
): Promise<void> {
  const ballotId = `${votingId}-ballot-${apartmentNumber}`;
  return withClient(async (client) => {
    const apartments = await client.query<{
      id: string;
      userId: string;
      number: string;
    }>(loadSql('select-voter-apartments.sql'), [hoaId]);
    const apartment = apartments.rows.find((a) => a.number === apartmentNumber);
    if (!apartment) throw new Error(`No apartment ${apartmentNumber}`);

    await client.query(loadSql('insert-voting-ballot.sql'), [
      ballotId,
      votingId,
      apartment.id,
      apartment.userId,
      new Date(),
    ]);
    for (const [index, choice] of choices.entries()) {
      await client.query(loadSql('insert-voting-vote.sql'), [
        `${ballotId}-${index}`,
        ballotId,
        questionId(votingId, index),
        choice,
      ]);
    }
  });
}
