/**
 * Login and registration are checked against the Turnstile mock.
 */

import { expect, test } from '../fixtures';
import {
  stubTurnstileWidget,
  TURNSTILE_INVALID_TOKEN,
  TURNSTILE_VALID_TOKEN,
} from '../utils/mock-server';
import { USER_EMAIL, USER_PASSWORD } from '../utils/test-credentials';

const PASSWORD = 'SecurePassword123!';

async function submitLogin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(USER_EMAIL);
  await page.getByLabel('Hasło', { exact: true }).fill(USER_PASSWORD);
  await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
}

test.describe('Turnstile', () => {
  test('login succeeds with a valid token', async ({ page }) => {
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

    await submitLogin(page);

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login is rejected with an invalid token', async ({ page }) => {
    await stubTurnstileWidget(page, TURNSTILE_INVALID_TOKEN);

    await submitLogin(page);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('the form stays disabled until the widget is solved', async ({
    page,
  }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' })
    );

    await page.goto('/login');

    await expect(
      page.getByRole('button', { name: 'Zaloguj się', exact: true })
    ).toBeDisabled();
  });

  test('registration is rejected with an invalid token', async ({ page }) => {
    await stubTurnstileWidget(page, TURNSTILE_INVALID_TOKEN);

    await page.goto('/register');
    await page.getByLabel('Email').fill(`blocked-${Date.now()}@e2e-test.com`);
    await page.getByLabel('Hasło', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Potwierdź hasło').fill(PASSWORD);
    await page.getByRole('button', { name: /Zarejestruj się/i }).click();

    await expect(
      page.getByText('Nieprawidłowe potwierdzenie turnstile')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});
