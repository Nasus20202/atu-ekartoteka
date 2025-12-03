/**
 * Custom Playwright fixtures for E2E tests.
 * Provides authenticated page contexts for admin and user roles.
 */

import { Page, test as base } from '@playwright/test';

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  USER_EMAIL,
  USER_PASSWORD,
} from './utils/test-credentials';

/**
 * Login helper function
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Hasło', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });
}

/**
 * Extended test fixtures
 */
export const test = base.extend<{
  adminPage: Page;
  userPage: Page;
}>({
  /**
   * Page already logged in as admin
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await use(page);
    await context.close();
  },

  /**
   * Page already logged in as regular user
   */
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, USER_EMAIL, USER_PASSWORD);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
