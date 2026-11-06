/**
 * Fills in the login and registration forms with a Turnstile stub, so specs
 * that need an auth request only state the values they care about.
 */

import { expect, type Page } from '@playwright/test';

import { stubTurnstileWidget, TURNSTILE_VALID_TOKEN } from './mock-server';

const LOGIN_PATH = '/login';
const REGISTER_PATH = '/register';
const LOGIN_REJECTED_MESSAGE = 'Nieprawidłowy email lub hasło';

export async function submitLoginForm(
  page: Page,
  email: string,
  password: string,
  turnstileToken = TURNSTILE_VALID_TOKEN
): Promise<void> {
  await stubTurnstileWidget(page, turnstileToken);
  await page.goto(LOGIN_PATH);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Hasło', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
}

export async function submitRegistrationForm(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);
  await page.goto(REGISTER_PATH);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Hasło', { exact: true }).fill(password);
  await page.getByLabel('Potwierdź hasło').fill(password);
  await page.getByRole('button', { name: /Zarejestruj się/i }).click();
}

/** Waits for the login form to report that the credentials were rejected. */
export async function expectLoginRejected(page: Page): Promise<void> {
  await expect(page.getByText(LOGIN_REJECTED_MESSAGE)).toBeVisible();
}
