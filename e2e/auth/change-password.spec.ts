/**
 * Change password flow tests (forced password change on first login)
 */

import { expect, test } from '../fixtures';
import { createMustChangePasswordUser } from '../utils/create-must-change-password-user';
import {
  MUST_CHANGE_PASSWORD_NEW_PASSWORD,
  MUST_CHANGE_PASSWORD_PASSWORD,
} from '../utils/test-credentials';

test.describe.serial('Change Password', () => {
  test.beforeEach(async () => {
    await createMustChangePasswordUser();
  });

  test('change password page shows correct UI', async ({
    mustChangePasswordPage: page,
  }) => {
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    await expect(page.getByText('Ustaw nowe hasło')).toBeVisible();
    await expect(
      page.getByText('Musisz ustawić nowe hasło przed kontynuowaniem.')
    ).toBeVisible();
    await expect(page.getByLabel('Nowe hasło', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Potwierdź nowe hasło')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ustaw hasło' })
    ).toBeVisible();
  });

  test('shows error when password is too short', async ({
    mustChangePasswordPage: page,
  }) => {
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    // Fill a password below minimum length and attempt to submit
    await page.getByLabel('Nowe hasło', { exact: true }).fill('short');
    await page.getByLabel('Potwierdź nowe hasło').fill('short');
    await page.getByRole('button', { name: 'Ustaw hasło' }).click();

    // Browser native validation (minLength=8) or JS validation keeps us on the page
    await expect(page).toHaveURL(/\/change-password/);
    await expect(
      page.getByRole('button', { name: 'Ustaw hasło' })
    ).toBeVisible();
  });

  test('shows error when passwords do not match', async ({
    mustChangePasswordPage: page,
  }) => {
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    await page
      .getByLabel('Nowe hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page.getByLabel('Potwierdź nowe hasło').fill('DifferentPassword789!');
    await page.getByRole('button', { name: 'Ustaw hasło' }).click();

    await expect(page.getByText('Hasła nie są identyczne')).toBeVisible();
    await expect(page).toHaveURL(/\/change-password/);
  });

  test('successful password change redirects to dashboard', async ({
    mustChangePasswordPage: page,
  }) => {
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    await page
      .getByLabel('Nowe hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page
      .getByLabel('Potwierdź nowe hasło')
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page.getByRole('button', { name: 'Ustaw hasło' }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('after password change /change-password redirects to dashboard', async ({
    mustChangePasswordPage: page,
  }) => {
    // Change the password first
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    await page
      .getByLabel('Nowe hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page
      .getByLabel('Potwierdź nowe hasło')
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page.getByRole('button', { name: 'Ustaw hasło' }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Now try to go back to /change-password — should be redirected away
    await page.goto('/change-password');

    await page.waitForURL((url) => !url.pathname.includes('/change-password'), {
      timeout: 10000,
    });
    await expect(page).not.toHaveURL(/\/change-password/);
  });

  test('can log in with new password after change', async ({
    mustChangePasswordPage: page,
    browser,
  }) => {
    // Change the password
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    await page
      .getByLabel('Nowe hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page
      .getByLabel('Potwierdź nowe hasło')
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page.getByRole('button', { name: 'Ustaw hasło' }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Log in with new password in a fresh context
    const context = await browser.newContext();
    const freshPage = await context.newPage();

    await freshPage.goto('/login');
    await freshPage
      .getByLabel('Email')
      .fill('must-change-password@e2e-test.com');
    await freshPage
      .getByLabel('Hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await freshPage
      .getByRole('button', { name: 'Zaloguj się', exact: true })
      .click();

    await freshPage.waitForURL('**/dashboard**', { timeout: 10000 });
    await expect(freshPage).toHaveURL(/\/dashboard/);

    await context.close();
  });

  test('old password does not work after change', async ({
    mustChangePasswordPage: page,
    browser,
  }) => {
    // Change the password
    await page.waitForURL('**/change-password**', { timeout: 10000 });

    await page
      .getByLabel('Nowe hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page
      .getByLabel('Potwierdź nowe hasło')
      .fill(MUST_CHANGE_PASSWORD_NEW_PASSWORD);
    await page.getByRole('button', { name: 'Ustaw hasło' }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Try to log in with old password in a fresh context
    const context = await browser.newContext();
    const freshPage = await context.newPage();

    await freshPage.goto('/login');
    await freshPage
      .getByLabel('Email')
      .fill('must-change-password@e2e-test.com');
    await freshPage
      .getByLabel('Hasło', { exact: true })
      .fill(MUST_CHANGE_PASSWORD_PASSWORD);
    await freshPage
      .getByRole('button', { name: 'Zaloguj się', exact: true })
      .click();

    // Should remain on login or show an error — not navigate to dashboard
    await expect(freshPage).not.toHaveURL(/\/dashboard/, { timeout: 8000 });

    await context.close();
  });
});
