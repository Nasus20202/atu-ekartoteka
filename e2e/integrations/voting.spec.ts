/**
 * An admin runs a voting end to end: creates it, publishes it, an owner votes
 * with the emailed one-time code, and the results reach the owner once shown.
 */

import { expect, test } from '../fixtures';
import { createVotingTenant } from '../utils/create-voting-tenant';
import { expectDeliveredEmail } from '../utils/email-assertions';
import { loginWithTurnstile, waitForMail } from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import {
  answerQuestion,
  confirmAdminAction,
  countBallots,
  createDraftVoting,
  publishVoting,
} from '../utils/voting';

const CODE_SUBJECT = 'Kod potwierdzający głosowanie';
const NOTIFICATION_SUBJECT = 'Nowe głosowanie w Twojej wspólnocie';
const CODE_LINE = /Kod potwierdzający\s+(\d{6})/;
const WRONG_CODE = '000000';

test('owners vote with an emailed code and see the published results', async ({
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
      both: [title],
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

    // Voting needs every answer, then a code from the email
    await owner.goto(`/dashboard/votings/${votingId}`);
    await expect(
      owner.getByText('Masz 2 lokale w tej wspólnocie')
    ).toBeVisible();
    const next = owner.getByRole('button', { name: /Dalej/ });
    await expect(next).toBeDisabled();
    await answerQuestion(owner, 1, 'Za');
    await answerQuestion(owner, 2, 'Przeciw');
    await next.click();

    await owner.getByLabel('Kod z wiadomości').fill(WRONG_CODE);
    await owner.getByRole('button', { name: /Potwierdź i zagłosuj/ }).click();
    await expect(owner.getByText('Nieprawidłowy kod')).toBeVisible();
    expect(await countBallots(votingId)).toBe(0);

    const mail = await waitForMail(request, tenant.email, {
      subject: CODE_SUBJECT,
    });
    const code = mail.text.match(CODE_LINE)?.[1] ?? '';
    expect(code).toMatch(/^\d{6}$/);
    expectDeliveredEmail(mail, {
      to: tenant.email,
      subject: CODE_SUBJECT,
      both: [code, title],
    });
    await owner.getByLabel('Kod z wiadomości').fill(code);
    await owner.getByRole('button', { name: /Potwierdź i zagłosuj/ }).click();
    await expect(owner.getByText('Dziękujemy, głos oddany')).toBeVisible();
    expect(await countBallots(votingId)).toBe(2);

    // The vote is final: no form, own answers, no results while active
    await owner.reload();
    await expect(
      owner.getByText('Twój głos został oddany i potwierdzony')
    ).toBeVisible();
    await expect(owner.getByRole('button', { name: /Dalej/ })).toBeHidden();
    await expect(owner.getByRole('progressbar')).toHaveCount(0);
    await owner.goto('/dashboard');
    await expect(
      owner.getByTestId(`dashboard-voting-${votingId}`).getByRole('link', {
        name: 'Zobacz',
      })
    ).toBeVisible();
    await owner.goto(`/dashboard/votings/${votingId}`);

    // The admin sees who voted what, then shows the results
    await page.reload();
    await page.getByRole('tab', { name: 'Kto jak głosował' }).click();
    await expect(page.getByText(tenant.email)).toHaveCount(2);
    await expect(page.getByText('1. Za')).toHaveCount(2);
    await expect(page.getByText('2. Przeciw')).toHaveCount(2);
    await confirmAdminAction(page, 'Pokaż wyniki');
    await expect(
      page.getByRole('button', { name: 'Zarchiwizuj' })
    ).toBeVisible();

    // The owner now sees aggregate results without any voter names
    await owner.reload();
    await expect(owner.getByRole('progressbar').first()).toBeVisible();
    await expect(owner.getByText(tenant.email)).toBeHidden();
    await expect(owner.getByText('2 (100%)')).toHaveCount(2);
  } finally {
    await ownerContext.close();
  }
});
