/**
 * Browser and database helpers for the voting specs.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import * as pg from 'pg';

import { formatLongDay } from '../../src/lib/shared/utils/calendar';
import { splitDateTime } from '../../src/lib/shared/utils/date-time';
import { chooseSearchedOption } from './choose-searched-option';
import { loadSql } from './load-sql';

const TEST_HOA_NAME = 'Test HOA';
const MAX_MONTHS_AHEAD = 24;
export const CHOICE_TIMEOUT_MS = 1000;
const CLOSE_VOTING = 'Zakończ głosowanie';
const VOTING_ID_PATTERN = /\/admin\/votings\/([^/?]+)$/;

export interface DraftVoting {
  /** The test HOA unless named; another one is found by typing */
  hoaName?: string;
  title: string;
  questions: string[];
  /** Local date and time of the deadline, e.g. 2026-12-31T10:00 */
  endsAt?: string;
  blockAbstain?: boolean;
}

/** Creates a draft for the test HOA through the form and returns its id. */
export async function createDraftVoting(
  page: Page,
  { hoaName, title, questions, endsAt, blockAbstain }: DraftVoting
): Promise<string> {
  await page.goto('/admin/votings/new');
  const hoaSelect = page.getByLabel('Wspólnota');
  await hoaSelect.click();
  if (hoaName) {
    await chooseSearchedOption(
      page.getByRole('combobox', { name: 'Szukaj wspólnoty' }),
      hoaName,
      page.getByRole('option', { name: hoaName, exact: true })
    );
  } else {
    await page
      .getByRole('option', { name: TEST_HOA_NAME, exact: true })
      .click();
  }
  // The closing list takes the focus back; typing before that can be lost
  await expect(hoaSelect).toBeFocused();
  await page.getByLabel('Tytuł').fill(title);

  for (const [index, question] of questions.entries()) {
    if (index > 0) {
      await page.getByRole('button', { name: 'Dodaj pytanie' }).click();
    }
    await page
      .getByRole('textbox', { name: `Treść pytania ${index + 1}` })
      .fill(question);
  }
  if (endsAt) await pickDeadline(page, endsAt);
  if (blockAbstain) {
    await page.getByRole('checkbox', { name: /Zablokuj odpowiedź/ }).check();
  }

  await page.getByRole('button', { name: 'Utwórz głosowanie' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  const id = VOTING_ID_PATTERN.exec(new URL(page.url()).pathname)?.[1];
  if (!id) throw new Error(`No voting id in ${page.url()}`);
  return id;
}

/** Picks a future deadline in the calendar and types its time. */
async function pickDeadline(page: Page, value: string) {
  const parts = splitDateTime(value);
  if (!parts) throw new Error(`Not a date and time: ${value}`);

  await page.getByLabel(/Termin zakończenia/).click();
  const day = page.getByRole('button', {
    name: formatLongDay(parts.day),
    exact: true,
  });
  for (
    let month = 0;
    month < MAX_MONTHS_AHEAD && (await day.count()) === 0;
    month++
  ) {
    await page.getByRole('button', { name: 'Następny miesiąc' }).click();
  }
  await day.click();
  const [hours, minutes] = parts.time.split(':');
  await page.getByRole('textbox', { name: 'Godziny' }).fill(hours);
  await page.getByRole('textbox', { name: 'Minuty' }).fill(minutes);
  await page.getByRole('button', { name: 'Gotowe' }).click();
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

export async function closeVoting(page: Page) {
  await confirmAdminAction(page, CLOSE_VOTING);
  await expect(page.getByRole('button', { name: 'Zarchiwizuj' })).toBeVisible();
  await expect(page.getByRole('button', { name: CLOSE_VOTING })).toBeHidden();
}

/** Enters a meeting vote on a one-question draft, finding it by its owner. */
export async function enterMeetingBallot(
  page: Page,
  owner: string,
  apartmentNumber: string,
  choice: 'Za' | 'Przeciw'
) {
  const form = page.getByRole('form', { name: 'Nowy głos z zebrania' });
  const apartment = form.getByRole('button', { name: 'Lokal' });
  await apartment.click();
  await chooseSearchedOption(
    page.getByRole('combobox'),
    owner,
    page.getByRole('option', { name: `/${apartmentNumber} – ${owner}` })
  );
  await expect(apartment).toContainText(owner);
  await answerQuestion(page, 1, choice);
  await form.getByRole('button', { name: 'Zapisz głos' }).click();
}

/** The ballot of one apartment, for an owner of several. */
export function apartmentBallot(page: Page, apartmentNumber: string) {
  return page.getByRole('region', { name: `/${apartmentNumber}` });
}

/** Picks an answer for the numbered question, the way a person clicks the label. */
export async function answerQuestion(
  scope: Page | Locator,
  questionNumber: number,
  choice: 'Za' | 'Przeciw' | 'Wstrzymał(a) się'
) {
  // One group per question, in their order
  const group = scope.locator('fieldset').nth(questionNumber - 1);
  // A click made while the page still scrolls can miss, so it is repeated until
  // the answer is chosen
  await expect(async () => {
    await group.getByText(choice, { exact: true }).click();
    await expect(
      group.getByRole('radio', { name: choice, exact: true })
    ).toBeChecked({ timeout: CHOICE_TIMEOUT_MS });
  }).toPass();
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

/** Lets the emailed confirmation links of a voting expire without waiting. */
export function expireVoteConfirmations(votingId: string) {
  return withClient((client) =>
    client.query(loadSql('expire-vote-confirmations.sql'), [votingId])
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
