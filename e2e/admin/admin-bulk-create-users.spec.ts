/**
 * E2E tests for admin bulk user creation from unassigned apartments.
 */

import { expect, test } from '../fixtures';
import { createUnassignedApartment } from '../utils/create-unassigned-apartment';

test.describe.serial('Admin Bulk User Creation', () => {
  let unassignedApartmentId: string;

  test.beforeEach(async () => {
    unassignedApartmentId = await createUnassignedApartment();
  });

  test('admin sees bulk-create link on users page', async ({ adminPage }) => {
    await adminPage.goto('/admin/users');

    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

    // Open the "Akcje" dropdown to reveal the bulk-create link
    await adminPage.getByRole('button', { name: /Akcje/i }).click();

    await expect(
      adminPage.getByRole('menuitem', { name: /Utwórz wiele kont/i })
    ).toBeVisible();
  });

  test('bulk-create page loads and shows apartment list', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/bulk-create');

    await expect(
      adminPage.getByRole('heading', { name: /Utwórz wiele kont/i })
    ).toBeVisible();

    await expect(adminPage.getByRole('checkbox').first()).toBeVisible();
  });

  test('confirm button is disabled when nothing is selected', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/bulk-create');

    await expect(
      adminPage.getByRole('heading', { name: /Utwórz wiele kont/i })
    ).toBeVisible();

    await expect(adminPage.getByRole('checkbox').first()).toBeVisible();

    await expect(
      adminPage.getByRole('button', { name: /Utwórz konta/i })
    ).toBeDisabled();
  });

  test('admin can select all apartments in a HOA group', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/bulk-create');

    await expect(
      adminPage.getByRole('heading', { name: /Utwórz wiele kont/i })
    ).toBeVisible();

    const hoaCheckbox = adminPage
      .getByRole('checkbox', { name: /Zaznacz wszystkie w/i })
      .first();
    await expect(hoaCheckbox).toBeVisible();
    await hoaCheckbox.click();

    await expect(
      adminPage.getByRole('button', { name: /Utwórz konta/i })
    ).toBeEnabled();

    await expect(adminPage.getByText(/Wybrano \d+ z \d+/i)).toBeVisible();
  });

  test('admin creates accounts for selected apartments and success message is shown', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/bulk-create');

    await expect(
      adminPage.getByRole('heading', { name: /Utwórz wiele kont/i })
    ).toBeVisible();

    // Select the unassigned apartment checkbox by data attribute or first individual checkbox
    const apartmentCheckboxes = adminPage.getByRole('checkbox').filter({
      hasNot: adminPage.locator('[aria-label*="Zaznacz wszystkie"]'),
    });
    await expect(apartmentCheckboxes.first()).toBeVisible();
    await apartmentCheckboxes.first().click();

    const confirmButton = adminPage.getByRole('button', {
      name: /Utwórz konta/i,
    });
    await expect(confirmButton).toBeEnabled();

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users/bulk-create') &&
          resp.status() === 200
      ),
      confirmButton.click(),
    ]);

    await expect(adminPage.getByText(/Utworzono \d+ kont/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('newly created bulk user appears as APPROVED in admin users list', async ({
    adminPage,
  }) => {
    // Create user for the unassigned apartment via the API
    const createResponse = await adminPage.request.post(
      '/api/admin/users/bulk-create',
      { data: { apartmentIds: [unassignedApartmentId] } }
    );
    expect(createResponse.ok()).toBe(true);

    // Navigate to the admin users list
    await adminPage.goto('/admin/users');
    await adminPage.getByRole('button', { name: /Wszyscy/i }).click();

    // The created user's email is derived from the apartment's email field
    await expect(adminPage.getByText('unassigned@e2e-test.com')).toBeVisible({
      timeout: 10000,
    });

    const userCard = adminPage
      .locator('[class*="card"]')
      .filter({ hasText: 'unassigned@e2e-test.com' });
    await expect(userCard.getByText(/zatwierdzony/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
