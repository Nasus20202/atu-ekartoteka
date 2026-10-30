/**
 * Infinite scrolling of the admin users list
 */

import { expect, test } from '../fixtures';
import { openUsersPage, searchUsers } from '../utils/admin-users';
import {
  createScrollTestUsers,
  deleteScrollTestUsers,
} from '../utils/scroll-test-users';

// More than the API's default page of 50 users
const USER_COUNT = 55;
const LOAD_TIMEOUT_MS = 10000;

test.describe('Admin users infinite scroll', () => {
  let prefix: string;

  test.beforeAll(async () => {
    prefix = await createScrollTestUsers(USER_COUNT);
  });

  test.afterAll(async () => {
    await deleteScrollTestUsers(prefix);
  });

  test('scrolling loads users beyond the first page', async ({ adminPage }) => {
    await openUsersPage(adminPage);
    await adminPage.getByRole('button', { name: /Odrzucone/i }).click();
    await searchUsers(adminPage, prefix);

    const cards = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: prefix });
    await expect(cards.first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    await expect(
      adminPage.getByRole('button', { name: /Następna|Poprzednia/ })
    ).toHaveCount(0);
    await expect(adminPage.getByText(/Strona \d+ z \d+/)).toHaveCount(0);

    await expect(async () => {
      await adminPage.mouse.wheel(0, 20000);
      await expect(cards).toHaveCount(USER_COUNT, { timeout: 1000 });
    }).toPass({ timeout: LOAD_TIMEOUT_MS });

    // Created with descending timestamps, so the oldest user comes last
    await expect(cards.last()).toContainText(`${prefix}-${USER_COUNT}@`);
    await expect(
      adminPage.getByRole('button', { name: 'Pokaż więcej' })
    ).toHaveCount(0);
  });

  test('switching the filter restarts the list', async ({ adminPage }) => {
    await openUsersPage(adminPage);
    await adminPage.getByRole('button', { name: /Odrzucone/i }).click();
    await searchUsers(adminPage, prefix);

    const cards = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: prefix });
    await expect(cards.first()).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

    await adminPage.getByRole('button', { name: /Zatwierdzone/i }).click();

    await expect(cards).toHaveCount(0, { timeout: LOAD_TIMEOUT_MS });
  });
});
