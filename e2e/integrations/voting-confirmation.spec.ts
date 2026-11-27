/**
 * The emailed confirmation link is rate limited like the email verification
 * link, belongs to one owner, is single use and expires.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { createVotingTenant } from '../utils/create-voting-tenant';
import {
  extractLink,
  loginWithTurnstile,
  MOCK_URL,
  type MockMail,
  waitForMail,
} from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import {
  answerQuestion,
  countBallots,
  createDraftVoting,
  expireVoteConfirmations,
  expireVotingDeadline,
  publishVoting,
} from '../utils/voting';

const CONFIRMATION_SUBJECT = 'Potwierdź swój głos';
const CONFIRM_PATH = '/dashboard/votings/confirm/';
const RATE_LIMIT_MESSAGE = /Poczekaj [1-5] min przed ponownym wysłaniem linku/;
const UNUSABLE_LINK = /Ten link jest nieprawidłowy/;
const UNKNOWN_TOKEN = 'A'.repeat(43);

/** An owner with a published voting, signed in and waiting at the email step. */
async function startBallot(
  admin: Page,
  owner: Page,
  request: Parameters<typeof waitForMail>[0]
) {
  const tenant = await createVotingTenant();
  await loginWithTurnstile(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  const votingId = await createDraftVoting(admin, {
    title: `Link E2E ${Date.now()}`,
    questions: ['Czy się zgadzasz?'],
  });
  await publishVoting(admin);

  await loginWithTurnstile(owner, tenant.email, tenant.password);
  await owner.goto(`/dashboard/votings/${votingId}`);
  await answerQuestion(owner, 1, 'Za');
  await owner.getByRole('button', { name: /Dalej/ }).click();
  await expect(owner.getByText('Sprawdź swoją skrzynkę email')).toBeVisible();

  const mail = await waitForMail(request, tenant.email, {
    subject: CONFIRMATION_SUBJECT,
  });
  const link = extractLink(mail, CONFIRM_PATH);
  expect(new URL(link).pathname.slice(CONFIRM_PATH.length)).toMatch(
    /^[A-Za-z0-9_-]{43}$/
  );

  return { tenant, votingId, link };
}

test('a second link is refused for five minutes and no second email is sent', async ({
  page,
  browser,
  request,
}) => {
  test.slow();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    const { tenant } = await startBallot(page, owner, request);

    await owner.getByRole('button', { name: 'Wyślij link ponownie' }).click();
    await expect(owner.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();

    // Sending the answers again after going back is limited the same way
    await owner.getByRole('button', { name: 'Zmień odpowiedzi' }).click();
    await owner.getByRole('button', { name: /Dalej/ }).click();
    await expect(owner.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();

    const mails = (await (
      await request.get(`${MOCK_URL}/mail`, { params: { to: tenant.email } })
    ).json()) as MockMail[];
    expect(
      mails.filter((mail) => mail.subject === CONFIRMATION_SUBJECT)
    ).toHaveLength(1);
  } finally {
    await ownerContext.close();
  }
});

test('a link only works for the owner it was sent to', async ({
  page,
  browser,
  request,
}) => {
  test.slow();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const strangerContext = await browser.newContext();
  const stranger = await strangerContext.newPage();
  try {
    const { votingId, link } = await startBallot(page, owner, request);
    const other = await createVotingTenant();

    // Signed out, the link leads to the login and shows nothing
    await stranger.goto(link);
    await expect(stranger).toHaveURL(/\/login/);

    // Another owner sees the same message as for an unknown link
    await loginWithTurnstile(stranger, other.email, other.password);
    await stranger.goto(link);
    await expect(stranger.getByText(UNUSABLE_LINK)).toBeVisible();
    await expect(
      stranger.getByRole('button', { name: 'Potwierdź i zagłosuj' })
    ).toBeHidden();
    await stranger.goto(`${CONFIRM_PATH}${UNKNOWN_TOKEN}`);
    await expect(stranger.getByText(UNUSABLE_LINK)).toBeVisible();
    expect(await countBallots(votingId)).toBe(0);

    // The rightful owner can still use it
    await owner.goto(link);
    await owner.getByRole('button', { name: 'Potwierdź i zagłosuj' }).click();
    await expect(owner.getByText('Dziękujemy, głos oddany')).toBeVisible();
    expect(await countBallots(votingId)).toBe(1);
  } finally {
    await ownerContext.close();
    await strangerContext.close();
  }
});

test('an expired link is refused', async ({ page, browser, request }) => {
  test.slow();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    const { votingId, link } = await startBallot(page, owner, request);

    await expireVoteConfirmations(votingId);
    await owner.goto(link);
    await expect(owner.getByText(UNUSABLE_LINK)).toBeVisible();
    expect(await countBallots(votingId)).toBe(0);
  } finally {
    await ownerContext.close();
  }
});

test('a link is refused once the voting deadline has passed', async ({
  page,
  browser,
  request,
}) => {
  test.slow();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    const { votingId, link } = await startBallot(page, owner, request);

    await expireVotingDeadline(votingId);
    await owner.goto(link);
    await expect(owner.getByText(UNUSABLE_LINK)).toBeVisible();
    expect(await countBallots(votingId)).toBe(0);
  } finally {
    await ownerContext.close();
  }
});
