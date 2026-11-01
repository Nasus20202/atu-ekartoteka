/**
 * Admin on-demand validation of the data stored in the database.
 */

import { expect, test } from '../fixtures';

test.describe('Database validation', () => {
  test('admin can validate stored data from the import page', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    // Either outcome proves the checks ran: a clean database or per-HOA findings
    await expect(
      adminPage
        .getByText(/nie znaleziono błędów ani ostrzeżeń/)
        .or(adminPage.getByRole('button', { name: /^Wspólnota:/ }).first())
    ).toBeVisible();
  });
});
