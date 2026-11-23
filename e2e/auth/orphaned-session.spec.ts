/**
 * A session whose account was deleted must end instead of keeping access
 */

import type { Page } from '@playwright/test';

import { expect, login, test } from '../fixtures';
import { createCredentialsUser } from '../utils/create-credentials-user';
import { deleteUserAndApartmentsByEmail } from '../utils/delete-user-and-apartments-by-email';

const ORPHANED_PASSWORD = 'OrphanedPassword123!';
const ORPHANED_NAME = 'E2E Orphaned User';
const RANDOM_SUFFIX_RANGE = 100000;

/**
 * The server ends the session and redirects to the login page. Firefox can
 * report the aborted navigation as an unknown error, so retry the request.
 */
async function expectRedirectedToLogin(page: Page) {
  await expect(async () => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  }).toPass({ timeout: 15_000 });
}

test.describe('Orphaned session', () => {
  test('a session whose account was deleted is signed out', async ({
    browser,
  }) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * RANDOM_SUFFIX_RANGE)}`;
    const email = `orphaned-${suffix}@e2e-test.com`;
    await createCredentialsUser({
      email,
      password: ORPHANED_PASSWORD,
      name: ORPHANED_NAME,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page, email, ORPHANED_PASSWORD);
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);

      await deleteUserAndApartmentsByEmail(email);
      await expectRedirectedToLogin(page);

      // The session cookie is gone, so the login page no longer bounces away
      await expectRedirectedToLogin(page);
    } finally {
      await context.close();
      await deleteUserAndApartmentsByEmail(email);
    }
  });
});
