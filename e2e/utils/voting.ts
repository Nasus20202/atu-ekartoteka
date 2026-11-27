/**
 * Browser and database helpers for the voting specs.
 */

import { expect, type Page } from '@playwright/test';
import * as pg from 'pg';

import { loadSql } from './load-sql';

const TEST_HOA_NAME = 'Test HOA';
const VOTING_ID_PATTERN = /\/admin\/votings\/([^/?]+)$/;

export interface DraftVoting {
  title: string;
  questions: string[];
  /** Value for the datetime-local field, e.g. 2026-12-31T10:00 */
  endsAt?: string;
}

/** Creates a draft for the test HOA through the form and returns its id. */
export async function createDraftVoting(
  page: Page,
  { title, questions, endsAt }: DraftVoting
): Promise<string> {
  await page.goto('/admin/votings/new');
  await page.getByLabel('Wspólnota').click();
  await page.getByRole('menuitemradio', { name: TEST_HOA_NAME }).click();
  await page.getByLabel('Tytuł').fill(title);

  for (const [index, question] of questions.entries()) {
    if (index > 0) {
      await page.getByRole('button', { name: 'Dodaj pytanie' }).click();
    }
    await page
      .getByRole('textbox', { name: `Treść pytania ${index + 1}` })
      .fill(question);
  }
  if (endsAt) await page.getByLabel(/Termin zakończenia/).fill(endsAt);

  await page.getByRole('button', { name: 'Utwórz głosowanie' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  const id = VOTING_ID_PATTERN.exec(new URL(page.url()).pathname)?.[1];
  if (!id) throw new Error(`No voting id in ${page.url()}`);
  return id;
}

/** Loads the current page again; unlike reload() it waits for streamed content. */
export async function reopen(page: Page) {
  await page.goto(page.url());
}

/** Confirms the dialog of an admin action button, e.g. "Opublikuj". */
export async function confirmAdminAction(page: Page, label: string) {
  await page.getByRole('button', { name: label }).click();
  await page.getByRole('button', { name: label }).last().click();
}

export async function publishVoting(page: Page) {
  await confirmAdminAction(page, 'Opublikuj');
  await expect(page.getByText('Aktywne').first()).toBeVisible();
}

export async function showVotingResults(page: Page) {
  await confirmAdminAction(page, 'Pokaż wyniki');
  await expect(page.getByRole('button', { name: 'Zarchiwizuj' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pokaż wyniki' })).toBeHidden();
}

/** Picks an answer for the numbered question, the way a person clicks the label. */
export async function answerQuestion(
  page: Page,
  questionNumber: number,
  choice: 'Za' | 'Przeciw' | 'Wstrzymał(a) się'
) {
  await page
    .getByRole('group', { name: new RegExp(`^${questionNumber}\\.`) })
    .getByText(choice, { exact: true })
    .click();
}

async function withClient<T>(run: (client: pg.Client) => Promise<T>) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    return await run(client);
  } finally {
    await client.end();
  }
}

/** Lets the deadline pass without waiting for it. */
export function expireVotingDeadline(votingId: string) {
  return withClient((client) =>
    client.query(loadSql('expire-voting-deadline.sql'), [votingId])
  );
}

export function countBallots(votingId: string): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query<{ count: number }>(
      loadSql('select-voting-ballot-count.sql'),
      [votingId]
    );
    return result.rows[0].count;
  });
}

/** "YYYY-MM-DDTHH:mm" one day from now, for the deadline field. */
export function tomorrowForDeadlineField(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
