/**
 * An admin runs a voting end to end: creates it, publishes it, an owner votes
 * with the emailed one-time code, and the results reach the owner once shown.
 */

import { expect, test } from '../fixtures';
import { createVotingTenant } from '../utils/create-voting-tenant';
import { expectDeliveredEmail } from '../utils/email-assertions';
import { loginWithTurnstile, waitForMail } from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';

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

  // The admin creates a draft for the test HOA
  await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin/votings/new');
  await page.getByLabel('Wspólnota').click();
  await page.getByRole('menuitemradio', { name: 'Test HOA' }).click();
  await page.getByLabel('Tytuł').fill(title);
  await page
    .getByRole('textbox', { name: 'Treść pytania 1' })
    .fill('Czy zgadzasz się na remont dachu?');
  await page.getByRole('button', { name: 'Dodaj pytanie' }).click();
  await page
    .getByRole('textbox', { name: 'Treść pytania 2' })
    .fill('Czy wybieramy firmę A?');
  await page.getByRole('button', { name: 'Utwórz głosowanie' }).click();

  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Wersja robocza')).toBeVisible();

  // A draft stays invisible to owners
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    await loginWithTurnstile(owner, tenant.email, tenant.password);
    await owner.goto('/dashboard/votings');
    await expect(owner.getByText(title)).toBeHidden();

    // Publishing makes it visible and notifies the owner
    await page.getByRole('button', { name: 'Opublikuj' }).click();
    await page.getByRole('button', { name: 'Opublikuj' }).last().click();
    await expect(page.getByText('Aktywne').first()).toBeVisible();

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
    });

    // The owner sees the navbar badge and the dashboard card
    await owner.goto('/dashboard');
    await expect(
      owner.getByRole('status', { name: /czekające na Twój głos: 1/ }).first()
    ).toBeVisible();
    await expect(owner.getByText(title)).toBeVisible();

    // Voting needs every answer, then a code from the email
    await owner.goto('/dashboard/votings');
    await owner
      .getByRole('link', { name: /Zagłosuj/ })
      .first()
      .click();
    await expect(
      owner.getByText('Masz 2 lokale w tej wspólnocie')
    ).toBeVisible();
    const next = owner.getByRole('button', { name: /Dalej/ });
    await expect(next).toBeDisabled();
    await owner
      .getByRole('group', { name: /^1\./ })
      .getByText('Za', { exact: true })
      .click();
    await owner
      .getByRole('group', { name: /^2\./ })
      .getByText('Przeciw', { exact: true })
      .click();
    await next.click();

    await owner.getByLabel('Kod z wiadomości').fill(WRONG_CODE);
    await owner.getByRole('button', { name: /Potwierdź i zagłosuj/ }).click();
    await expect(owner.getByText('Nieprawidłowy kod')).toBeVisible();

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

    // The vote is final and no results are shown while the voting is active
    await owner.reload();
    await expect(
      owner.getByText('Twój głos został oddany i potwierdzony')
    ).toBeVisible();
    await expect(owner.getByRole('progressbar')).toHaveCount(0);

    // The admin sees who voted what and publishes the results
    await page.reload();
    await page.getByRole('tab', { name: 'Kto jak głosował' }).click();
    await expect(page.getByText(tenant.email)).toHaveCount(2);
    await page.getByRole('button', { name: 'Pokaż wyniki' }).click();
    await page.getByRole('button', { name: 'Pokaż wyniki' }).last().click();
    await expect(page.getByText('Pokaż wyniki').first()).toBeVisible();

    // The owner now sees aggregate results without any voter names
    await owner.reload();
    await expect(owner.getByRole('progressbar').first()).toBeVisible();
    await expect(owner.getByText(tenant.email)).toBeHidden();
  } finally {
    await ownerContext.close();
  }
});
