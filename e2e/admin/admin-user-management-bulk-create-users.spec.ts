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

  test('admin sees management link on users page', async ({ adminPage }) => {
    await adminPage.goto('/admin/users');

    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

    // Open the "Akcje" dropdown to reveal the management link
    await adminPage.getByRole('button', { name: /Akcje/i }).click();

    await expect(
      adminPage.getByRole('menuitem', { name: /Zarządzanie kontami/i })
    ).toBeVisible();
  });

  test('management page loads and shows apartment list', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await expect(
      adminPage.getByRole('heading', { name: /Zarządzanie kontami/i })
    ).toBeVisible();

    // HOA cards start collapsed — click the CollapsibleTrigger (HOA name) to expand
    await adminPage.getByText('Test HOA').first().click();

    await expect(adminPage.getByRole('checkbox').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('confirm button is disabled when nothing is selected', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await expect(
      adminPage.getByRole('heading', { name: /Zarządzanie kontami/i })
    ).toBeVisible();

    await expect(
      adminPage.getByRole('button', { name: /Utwórz konta/i })
    ).toBeDisabled();
  });

  test('admin can select all apartments in a HOA group', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await expect(
      adminPage.getByRole('heading', { name: /Zarządzanie kontami/i })
    ).toBeVisible();

    // Expand the first HOA card by clicking its name
    await adminPage.getByText('Test HOA').first().click();

    const hoaCheckbox = adminPage
      .getByRole('checkbox', { name: /Zaznacz wszystkie/i })
      .first();
    await expect(hoaCheckbox).toBeVisible({ timeout: 5000 });
    await hoaCheckbox.click();

    await expect(
      adminPage.getByRole('button', { name: /Utwórz konta/i })
    ).toBeEnabled();

    await expect(adminPage.getByText(/Wybrano \d+ z \d+/i)).toBeVisible();
  });

  test('admin creates accounts for selected apartments and success message is shown', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await expect(
      adminPage.getByRole('heading', { name: /Zarządzanie kontami/i })
    ).toBeVisible();

    // Expand the first HOA card then select the first individual apartment
    await adminPage.getByText('Test HOA').first().click();

    const apartmentCheckboxes = adminPage.getByRole('checkbox').filter({
      hasNot: adminPage.locator('[aria-label*="Zaznacz wszystkie"]'),
    });
    await expect(apartmentCheckboxes.first()).toBeVisible({ timeout: 5000 });
    await apartmentCheckboxes.first().click();

    const confirmButton = adminPage.getByRole('button', {
      name: /Utwórz konta/i,
    });
    await expect(confirmButton).toBeEnabled();

    await confirmButton.click();

    // Confirmation dialog appears — click confirm
    await expect(
      adminPage.getByRole('button', { name: /Potwierdź i utwórz/i })
    ).toBeVisible({ timeout: 5000 });

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users/bulk-create') &&
          resp.status() === 200
      ),
      adminPage.getByRole('button', { name: /Potwierdź i utwórz/i }).click(),
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
