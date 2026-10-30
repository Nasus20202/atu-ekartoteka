/**
 * Cards / table view switch on the admin apartments and users lists
 */

import { expect, test } from '../fixtures';
import { openUsersPage, userCard } from '../utils/admin-users';
import {
  createScrollTestHoa,
  deleteScrollTestHoa,
} from '../utils/scroll-test-hoa';
import { USER_EMAIL } from '../utils/test-credentials';

const APARTMENT_COUNT = 45;
const LOAD_TIMEOUT_MS = 10000;

test.describe('Admin list view switch', () => {
  let hoaId: string;

  test.beforeAll(async () => {
    hoaId = await createScrollTestHoa(APARTMENT_COUNT);
  });

  test.afterAll(async () => {
    await deleteScrollTestHoa(hoaId);
  });

  test('apartments switch to a sortable table, keep scrolling and remember the view', async ({
    adminPage,
  }) => {
    await adminPage.goto(`/admin/apartments/${hoaId}`);
    await expect(
      adminPage.getByText(`Znaleziono ${APARTMENT_COUNT} mieszkań`)
    ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    await expect(
      adminPage.getByRole('button', { name: 'Kafelki' })
    ).toHaveAttribute('aria-pressed', 'true');

    await adminPage.getByRole('button', { name: 'Tabela' }).click();

    const links = adminPage.getByRole('link', {
      name: /ul\. Przewijana 1\//,
    });
    await expect(links.first()).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Adres' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Właściciel' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Udział' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Status' })
    ).toBeVisible();

    const animationName = await adminPage.evaluate(() => {
      const container = document.querySelector(
        '[class*="animate-view-switch"]'
      );
      return container ? getComputedStyle(container).animationName : null;
    });
    expect(animationName).toBe('view-switch');

    const addressHeader = adminPage.getByRole('columnheader', {
      name: 'Adres',
    });
    const sortRequest = (order: 'asc' | 'desc') =>
      adminPage.waitForRequest(
        (request) =>
          request.url().includes('/api/admin/apartments?') &&
          request.url().includes('sort=label') &&
          request.url().includes(`order=${order}`)
      );

    const ascendingRequest = sortRequest('asc');
    await adminPage.evaluate(() => {
      document
        .querySelector('[class*="animate-view-switch"]')
        ?.setAttribute('data-view-container', 'kept');
    });
    await adminPage.getByRole('button', { name: 'Adres' }).click();
    await ascendingRequest;
    await expect(addressHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(adminPage.locator('[data-view-container="kept"]')).toHaveCount(
      1
    );

    const descendingRequest = sortRequest('desc');
    await adminPage.getByRole('button', { name: 'Adres' }).click();
    await descendingRequest;
    await expect(addressHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(links.first()).not.toHaveText('ul. Przewijana 1/1');

    await expect(async () => {
      await adminPage.mouse.wheel(0, 10000);
      await expect(links).toHaveCount(APARTMENT_COUNT, { timeout: 1000 });
    }).toPass({ timeout: LOAD_TIMEOUT_MS });

    const expectedDescending = Array.from(
      { length: APARTMENT_COUNT },
      (_, index) => `ul. Przewijana 1/${APARTMENT_COUNT - index}`
    );
    await expect(links).toHaveText(expectedDescending);

    await adminPage.reload();
    await expect(
      adminPage.getByRole('button', { name: 'Tabela' })
    ).toHaveAttribute('aria-pressed', 'true', { timeout: LOAD_TIMEOUT_MS });
    await expect(
      adminPage.getByRole('columnheader', { name: 'Adres' })
    ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

    await adminPage
      .getByRole('link', { name: 'ul. Przewijana 1/1' })
      .first()
      .click();
    await expect(adminPage).toHaveURL(
      new RegExp(`/admin/apartments/${hoaId}/[a-f0-9-]+$`),
      { timeout: LOAD_TIMEOUT_MS }
    );

    // The users list keeps its own choice and still starts in cards
    await openUsersPage(adminPage);
    await expect(
      adminPage.getByRole('button', { name: 'Kafelki' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('users switch to a sortable table with a working actions menu', async ({
    adminPage,
  }) => {
    await openUsersPage(adminPage);
    await adminPage.getByRole('button', { name: /Zatwierdzone/i }).click();
    await expect(userCard(adminPage, USER_EMAIL)).toContainText(
      'Zarejestrowano',
      { timeout: LOAD_TIMEOUT_MS }
    );

    await adminPage.getByRole('button', { name: 'Tabela' }).click();

    await expect(
      adminPage.getByRole('columnheader', { name: 'Użytkownik' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Mieszkania' })
    ).toBeVisible();
    const sortedUsersRequest = adminPage.waitForRequest(
      (request) =>
        request.url().includes('/api/admin/users?') &&
        request.url().includes('sort=name') &&
        request.url().includes('order=asc')
    );
    await adminPage.evaluate(() => {
      document
        .querySelector('[class*="animate-view-switch"]')
        ?.setAttribute('data-view-container', 'kept');
    });
    await adminPage.getByRole('button', { name: 'Użytkownik' }).click();
    await sortedUsersRequest;
    await expect(
      adminPage.getByRole('columnheader', { name: 'Użytkownik' })
    ).toHaveAttribute('aria-sort', 'ascending');
    await expect(adminPage.locator('[data-view-container="kept"]')).toHaveCount(
      1
    );

    const row = adminPage.getByRole('row').filter({ hasText: USER_EMAIL });
    await expect(row).toBeVisible();
    await expect(row).not.toContainText('Zarejestrowano');

    await row.getByRole('button', { name: 'Akcje' }).click();
    await adminPage.getByRole('menuitem', { name: /Zmień status/ }).click();
    await expect(adminPage.getByText(/Zmień status użytkownika/)).toBeVisible();
  });
});
