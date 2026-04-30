/**
 * E2E tests for the admin-only filter on /admin/users.
 */

import { expect, test } from '../fixtures';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import { deleteApartment } from '../utils/delete-apartment';
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

    await adminPage.getByLabel(/Wybierz mieszkanie/i).fill('ul. Testowa 1/2B');
    const apartmentOption = adminPage.locator('label').filter({
      hasText: externalOwnerId,
    });
    await expect(apartmentOption).toBeVisible({ timeout: 5000 });
    await apartmentOption.click();

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage
        .locator('.fixed.inset-0')
        .getByRole('button', { name: /Przypisz \(1\)/i })
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
