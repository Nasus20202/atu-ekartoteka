/**
 * The emailed code is rate limited like the email verification link and
 * locks after too many wrong attempts.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { createVotingTenant } from '../utils/create-voting-tenant';
import {
  loginWithTurnstile,
  MOCK_URL,
  type MockMail,
  waitForMail,
} from '../utils/mock-server';
import { isServerActionResponse } from '../utils/server-actions';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import {
  answerQuestion,
  countBallots,
  createDraftVoting,
  publishVoting,
} from '../utils/voting';

const CODE_SUBJECT = 'Kod potwierdzający głosowanie';
const CODE_LINE = /Kod potwierdzający\s+(\d{6})/;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MESSAGE = /Poczekaj [1-5] min przed ponownym wysłaniem kodu/;

/** An owner with a published voting, signed in and waiting at the code step. */
async function startBallot(
  admin: Page,
  owner: Page,
  request: Parameters<typeof waitForMail>[0]
) {
  const tenant = await createVotingTenant();
  await loginWithTurnstile(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  const votingId = await createDraftVoting(admin, {
    title: `Kod E2E ${Date.now()}`,
    questions: ['Czy się zgadzasz?'],
  });
  await publishVoting(admin);

  await loginWithTurnstile(owner, tenant.email, tenant.password);
  await owner.goto(`/dashboard/votings/${votingId}`);
  await answerQuestion(owner, 1, 'Za');
  await owner.getByRole('button', { name: /Dalej/ }).click();
  await expect(owner.getByLabel('Kod z wiadomości')).toBeVisible();

  const mail = await waitForMail(request, tenant.email, {
    subject: CODE_SUBJECT,
  });
  const code = mail.text.match(CODE_LINE)?.[1] ?? '';
  expect(code).toMatch(/^\d{6}$/);

  return { tenant, votingId, code };
}

async function submitCode(owner: Page, code: string) {
  await owner.getByLabel('Kod z wiadomości').fill(code);
  await Promise.all([
    owner.waitForResponse(isServerActionResponse),
    owner.getByRole('button', { name: /Potwierdź i zagłosuj/ }).click(),
  ]);
}

test('a second code is refused for five minutes and no second email is sent', async ({
  page,
  browser,
  request,
}) => {
  test.slow();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    const { tenant } = await startBallot(page, owner, request);

    await owner.getByRole('button', { name: 'Wyślij kod ponownie' }).click();
    await expect(owner.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();

    // Sending the answers again after going back is limited the same way
    await owner.getByRole('button', { name: 'Zmień odpowiedzi' }).click();
    await owner.getByRole('button', { name: /Dalej/ }).click();
    await expect(owner.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();

    const mails = (await (
      await request.get(`${MOCK_URL}/mail`, { params: { to: tenant.email } })
    ).json()) as MockMail[];
    expect(mails.filter((mail) => mail.subject === CODE_SUBJECT)).toHaveLength(
      1
    );
  } finally {
    await ownerContext.close();
  }
});

test('the code locks after five wrong attempts, even for the right code', async ({
  page,
  browser,
  request,
}) => {
  test.slow();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    const { votingId, code } = await startBallot(page, owner, request);
    // Two different wrong codes, so one of them is never the real one
    const [wrongCode] = ['111111', '222222'].filter((wrong) => wrong !== code);

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      await submitCode(owner, wrongCode);
      await expect(owner.getByText('Nieprawidłowy kod')).toBeVisible();
    }

    await submitCode(owner, wrongCode);
    await expect(owner.getByText(/Przekroczono liczbę prób/)).toBeVisible();

    await submitCode(owner, code);
    await expect(owner.getByText(/Przekroczono liczbę prób/)).toBeVisible();
    await expect(owner.getByText('Dziękujemy, głos oddany')).toBeHidden();
    expect(await countBallots(votingId)).toBe(0);

    // A new code is refused until the rate limit window is over
    await owner.getByRole('button', { name: 'Wyślij kod ponownie' }).click();
    await expect(owner.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();
  } finally {
    await ownerContext.close();
  }
});
