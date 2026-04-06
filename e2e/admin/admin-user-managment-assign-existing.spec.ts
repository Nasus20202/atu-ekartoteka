/**
 * E2E tests for admin assign-existing flow:
 * assigning existing tenant accounts to unassigned apartments.
 */

import { expect, test } from '../fixtures';
import { createUserWithUnassignedApartment } from '../utils/create-user-with-unassigned-apartment';
import { deleteUserAndApartmentsByEmail } from '../utils/delete-user-and-apartments-by-email';

test.describe.serial('Admin Bulk Assign Existing Users', () => {
  let email: string;
  let apartmentId: string;

  test.beforeEach(async () => {
    const seed = await createUserWithUnassignedApartment();
    email = seed.email;
    apartmentId = seed.apartmentId;
  });

  test.afterEach(async () => {
    await deleteUserAndApartmentsByEmail(email);
  });

  test('assign-existing tab is visible on management page', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await expect(
      adminPage.getByRole('tab', { name: /Przypisz istniejące/i })
    ).toBeVisible();
  });

  test('assign-existing tab shows assignable apartments', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/unassigned-apartments') &&
          resp.url().includes('mode=assignable') &&
          resp.status() === 200
      ),
      adminPage.getByRole('tab', { name: /Przypisz istniejące/i }).click(),
    ]);

    // HOA cards start collapsed — click the HOA name (CollapsibleTrigger) to expand
    await adminPage.getByText('Test HOA').first().click();

    // The seeded apartment email should be visible in the list
    await expect(adminPage.getByText(email)).toBeVisible({ timeout: 10000 });
  });

  test('admin assigns existing user to apartment and sees success', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/unassigned-apartments') &&
          resp.url().includes('mode=assignable') &&
          resp.status() === 200
      ),
      adminPage.getByRole('tab', { name: /Przypisz istniejące/i }).click(),
    ]);

    // Expand the first HOA card
    await adminPage.getByText('Test HOA').first().click();

    // Wait for apartment list to appear
    await expect(adminPage.getByText(email)).toBeVisible({ timeout: 10000 });

    // Select the specific apartment by its email text in the card
    const aptCard = adminPage.locator('label').filter({ hasText: email });
    await aptCard.click();

    const assignButton = adminPage.getByRole('button', {
      name: /Przypisz konta/i,
    });
    await expect(assignButton).toBeEnabled();

    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users/bulk-assign') &&
          resp.status() === 200
      ),
      assignButton.click(),
    ]);

    await expect(adminPage.getByText(/Przypisano \d+ mieszkań/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('assigned apartment no longer appears in assign tab after assignment', async ({
    adminPage,
  }) => {
    // Assign via API first
    const assignResp = await adminPage.request.post(
      '/api/admin/users/bulk-assign',
      { data: { apartmentIds: [apartmentId] } }
    );
    expect(assignResp.ok()).toBe(true);

    await adminPage.goto('/admin/users/management');
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/unassigned-apartments') &&
          resp.url().includes('mode=assignable') &&
          resp.status() === 200
      ),
      adminPage.getByRole('tab', { name: /Przypisz istniejące/i }).click(),
    ]);

    // After assignment, the email should NOT appear anywhere on the page
    await expect(adminPage.getByText(email)).not.toBeVisible({ timeout: 8000 });
  });
});
