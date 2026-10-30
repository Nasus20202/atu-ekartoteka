/**
 * E2E tests for selecting inactive apartments on the account management page.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import { deleteApartment } from '../utils/delete-apartment';

// Sorts after the shared test apartments so other specs never pick it first
const INACTIVE_APARTMENT_NUMBER = '999';

test.describe('Admin Account Management - inactive apartments', () => {
  let apartment: { id: string; email: string };

  test.beforeEach(async () => {
    apartment = await createUniqueUnassignedApartment({
      isActive: false,
      number: INACTIVE_APARTMENT_NUMBER,
    });
  });

  test.afterEach(async () => {
    await deleteApartment(apartment.id);
  });

  async function openTestHoa(page: Page) {
    await page.goto('/admin/users/management');
    await page.getByText('Test HOA').first().click();
    const row = page.locator('label', { hasText: apartment.email });
    await expect(row).toBeVisible({ timeout: 5000 });
    return row.getByRole('checkbox');
  }

  test('select all skips inactive apartments', async ({ adminPage }) => {
    const inactiveCheckbox = await openTestHoa(adminPage);

    await adminPage
      .getByRole('checkbox', { name: /Zaznacz wszystkie/i })
      .first()
      .click();

    await expect(inactiveCheckbox).not.toBeChecked();
  });

  test('inactive apartment is selected only after two confirmations', async ({
    adminPage,
  }) => {
    const inactiveCheckbox = await openTestHoa(adminPage);

    await inactiveCheckbox.click();
    const dialog = adminPage.getByRole('alertdialog');
    await expect(dialog).toContainText('Nieaktywne mieszkanie');

    await dialog.getByRole('button', { name: 'Kontynuuj' }).click();
    await expect(dialog).toContainText(
      'Potwierdź wybór nieaktywnego mieszkania'
    );
    await dialog.getByRole('button', { name: 'Tak, zaznacz' }).click();

    await expect(dialog).toBeHidden();
    await expect(inactiveCheckbox).toBeChecked();
  });
});
