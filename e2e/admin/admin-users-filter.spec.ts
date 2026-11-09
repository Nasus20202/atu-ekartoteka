/**
 * E2E tests for the admin-only filter on /admin/users.
 */

import { expect, test } from '../fixtures';
import { clickToCheck } from '../utils/click-to-check';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import { deleteApartment } from '../utils/delete-apartment';
import { isServerActionResponse } from '../utils/server-actions';
import { ADMIN_EMAIL } from '../utils/test-credentials';

test.describe.serial('Admin Users Filter', () => {
  let apartmentId: string;
  let externalOwnerId: string;

  test.beforeEach(async () => {
    const apartment = await createUniqueUnassignedApartment();
    apartmentId = apartment.id;
    externalOwnerId = apartment.externalOwnerId;
  });

  test.afterEach(async () => {
    await deleteApartment(apartmentId);
  });

  test('admin can filter administrators and assign an apartment to an admin user', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users');

    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') &&
          resp.url().includes('role=ADMIN') &&
          resp.status() === 200
      ),
      adminPage.getByRole('button', { name: /Administratorzy/i }).click(),
    ]);

    const adminCard = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: ADMIN_EMAIL });
    await expect(adminCard).toBeVisible({ timeout: 10000 });

    await adminCard.getByRole('button', { name: /Mieszkania/i }).click();
    await expect(adminPage.getByText(/Przypisz mieszkanie/i)).toBeVisible({
      timeout: 10000,
    });

    // Search by this test's own owner id: other tests share the database and
    // create apartments at the same address, which would crowd the results
    const searchResponse = adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/apartments') &&
        resp.url().includes(`search=${externalOwnerId}`) &&
        resp.status() === 200
    );
    await adminPage.getByLabel(/Wybierz mieszkanie/i).fill(externalOwnerId);
    await searchResponse;
    const apartmentOption = adminPage.locator('label').filter({
      hasText: externalOwnerId,
    });
    await expect(apartmentOption).toBeVisible({ timeout: 10000 });
    await clickToCheck(apartmentOption, apartmentOption.getByRole('checkbox'));

    await Promise.all([
      adminPage.waitForResponse(isServerActionResponse),
      adminPage
        .getByRole('dialog')
        .getByRole('button', { name: /^Przypisz \(1\)$/ })
        .click(),
    ]);

    await expect(adminPage.getByText(/Przypisz mieszkanie/i)).not.toBeVisible({
      timeout: 10000,
    });

    await expect(adminCard.getByText(/Przypisane mieszkania: 1/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(adminCard.getByText(/ul\. Testowa 1\/2B/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
