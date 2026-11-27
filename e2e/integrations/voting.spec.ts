/**
 * An admin runs a voting end to end: creates it, publishes it, an owner votes
 * with the emailed one-time link, and only the admin sees the results.
 */

import { expect, test } from '../fixtures';
import { createVotingTenant } from '../utils/create-voting-tenant';
import { expectDeliveredEmail } from '../utils/email-assertions';
import {
  extractLink,
  loginWithTurnstile,
  waitForMail,
} from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import {
  answerQuestion,
  apartmentBallot,
  CLOSE_VOTING,
  confirmAdminAction,
  countBallots,
  createDraftVoting,
  publishVoting,
  reopen,
} from '../utils/voting';

const CONFIRMATION_SUBJECT = 'Potwierdź swój głos';
const NOTIFICATION_SUBJECT = 'Nowe głosowanie w Twojej wspólnocie';
const CONFIRM_PATH = '/dashboard/votings/confirm/';

test('owners vote with an emailed link and only the admin sees results', async ({
  page,
  browser,
  request,
}) => {
  test.slow();
  const tenant = await createVotingTenant(2);
  const title = `Uchwała E2E ${Date.now()}`;

  await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  const votingId = await createDraftVoting(page, {
    title,
    questions: ['Czy zgadzasz się na remont dachu?', 'Czy wybieramy firmę A?'],
  });
  await expect(page.getByText('Wersja robocza')).toBeVisible();

  // A draft stays invisible to owners
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    await loginWithTurnstile(owner, tenant.email, tenant.password);
    await owner.goto('/dashboard/votings');
    await expect(owner.getByText(title)).toBeHidden();

    // Publishing makes it visible and the admin can notify the owner
    await publishVoting(page);
    await page.getByRole('button', { name: 'Powiadom użytkowników' }).click();
    await page.getByRole('checkbox', { name: tenant.name }).check();
    await page.getByRole('button', { name: /^Wyślij/ }).click();
    await expect(page.getByText(/Wysłano: \d+/)).toBeVisible();
    const notification = await waitForMail(request, tenant.email, {
      subject: NOTIFICATION_SUBJECT,
    });
    expectDeliveredEmail(notification, {
      to: tenant.email,
      subject: NOTIFICATION_SUBJECT,
      both: [title, 'Prosimy o oddanie głosu'],
      html: ['Przejdź do głosowania'],
      linkPath: `/dashboard/votings/${votingId}`,
    });

    // The owner sees the navbar badge and the dashboard card
    await owner.goto('/dashboard');
    await expect(
      owner
        .getByRole('status', { name: /czekające na Twój głos: [1-9]/ })
        .first()
    ).toBeVisible();
    await expect(
      owner.getByTestId(`dashboard-voting-${votingId}`).getByRole('link', {
        name: 'Zagłosuj',
      })
    ).toBeVisible();

    // Each apartment answers for itself; an unfinished one holds the form back
    await owner.goto(`/dashboard/votings/${votingId}`);
    await expect(owner.getByText(/Każdy lokal głosuje osobno/)).toBeVisible();
    const next = owner.getByRole('button', { name: /Dalej/ });
    await expect(next).toBeDisabled();
    const first = apartmentBallot(owner, 'V1');
    const second = apartmentBallot(owner, 'V2');
    await answerQuestion(first, 1, 'Za');
    await answerQuestion(first, 2, 'Przeciw');
    await expect(next).toBeEnabled();
    await answerQuestion(second, 1, 'Przeciw');
    await expect(next).toBeDisabled();
    await answerQuestion(second, 2, 'Przeciw');
    await next.click();

    // Nothing is stored until the link is opened and confirmed
    await expect(owner.getByText('Sprawdź swoją skrzynkę email')).toBeVisible();
    expect(await countBallots(votingId)).toBe(0);

    const mail = await waitForMail(request, tenant.email, {
      subject: CONFIRMATION_SUBJECT,
    });
    const link = extractLink(mail, CONFIRM_PATH);
    expectDeliveredEmail(mail, {
      to: tenant.email,
      subject: CONFIRMATION_SUBJECT,
      both: [title, '1. Czy zgadzasz się na remont dachu? – Przeciw'],
      html: ['Potwierdź głos'],
      linkPath: new URL(link).pathname,
    });

    // Opening the link only shows the answers; the button casts the vote
    await owner.goto(link);
    await expect(
      owner.getByRole('heading', { name: /^Lokal .*\/V[12]$/ })
    ).toHaveCount(2);
    expect(await countBallots(votingId)).toBe(0);
    await owner.getByRole('button', { name: 'Potwierdź i zagłosuj' }).click();
    await expect(owner.getByText('Dziękujemy, głos oddany')).toBeVisible();
    expect(await countBallots(votingId)).toBe(2);

    // The link works once
    await owner.goto(link);
    await expect(owner.getByText(/Ten link jest nieprawidłowy/)).toBeVisible();
    await owner.goto(`/dashboard/votings/${votingId}`);

    // The vote is final: no form, own answers, no results while active
    await reopen(owner);
    await expect(
      owner.getByText(/Twój głos został oddany i potwierdzony/)
    ).toHaveCount(2);
    await expect(owner.getByRole('button', { name: /Dalej/ })).toBeHidden();
    await expect(owner.getByRole('progressbar')).toHaveCount(0);
    await owner.goto('/dashboard');
    await expect(
      owner.getByTestId(`dashboard-voting-${votingId}`).getByRole('link', {
        name: 'Zobacz',
      })
    ).toBeVisible();
    await owner.goto(`/dashboard/votings/${votingId}`);

    // The admin sees who voted what, then closes the voting
    await reopen(page);
    await page.getByRole('tab', { name: 'Oddane głosy' }).click();
    // The voters render as a card list and a table, only one is visible
    const visible = { visible: true };
    await expect(page.getByText(tenant.email).filter(visible)).toHaveCount(2);
    await expect(page.getByText('1. Za').filter(visible)).toHaveCount(1);
    await expect(page.getByText('1. Przeciw').filter(visible)).toHaveCount(1);
    await expect(page.getByText('2. Przeciw').filter(visible)).toHaveCount(2);
    await confirmAdminAction(page, CLOSE_VOTING);
    await expect(
      page.getByRole('button', { name: 'Zarchiwizuj' })
    ).toBeVisible();

    // Results are the admin's: the apartments split on the first question
    await page.getByRole('tab', { name: 'Wyniki' }).click();
    await expect(page.getByText('1 (50%)')).toHaveCount(2);
    await expect(page.getByText('2 (100%)')).toHaveCount(1);

    // The owner sees that it ended, and their own answers only
    await reopen(owner);
    await expect(
      owner.getByText(/Głosowanie zostało zakończone/)
    ).toBeVisible();
    await expect(
      owner.getByText(/Twój głos został oddany i potwierdzony/)
    ).toHaveCount(2);
    await expect(owner.getByRole('progressbar')).toHaveCount(0);

    // A closed voting leaves the dashboard
    await owner.goto('/dashboard');
    await expect(owner.getByRole('heading', { name: /^Witaj/ })).toBeVisible();
    await expect(
      owner.getByTestId(`dashboard-voting-${votingId}`)
    ).toBeHidden();
  } finally {
    await ownerContext.close();
  }
});
