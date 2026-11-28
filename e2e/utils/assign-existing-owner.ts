/**
 * Assign the unassigned apartment of an existing account from the account
 * management page and wait for the server action.
 */

import { expect, type Page } from '@playwright/test';

import { openTestHoaCard } from './open-test-hoa';
import { isServerActionResponse } from './server-actions';

const LIST_TIMEOUT_MS = 10_000;

export async function assignExistingOwner(page: Page, email: string) {
  await page.goto('/admin/users/management');
  await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/unassigned-apartments') &&
        resp.url().includes('mode=assignable') &&
        resp.status() === 200
    ),
    page.getByRole('tab', { name: /Przypisz istniejące/i }).click(),
  ]);
  await openTestHoaCard(page);
  await expect(page.getByText(email)).toBeVisible({ timeout: LIST_TIMEOUT_MS });
  await page.locator('label').filter({ hasText: email }).click();

  await Promise.all([
    page.waitForResponse(isServerActionResponse),
    page.getByRole('button', { name: /Przypisz konta/i }).click(),
  ]);
}
