/**
 * Admin data import tests
 */

import * as path from 'path';

import { expect, test } from '../fixtures';

test.describe('Admin Data Import', () => {
  test('admin can import HOA data and see apartments', async ({
    adminPage,
  }) => {
    // Navigate to import page
    await adminPage.goto('/admin/import', { waitUntil: 'networkidle' });

    // Wait for page to load
    await expect(
      adminPage.getByRole('heading', { name: /Import danych/i })
    ).toBeVisible();

    // Get the file input and upload the test data directory
    const testDataPath = path.resolve(__dirname, '../test-data/import');
    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(testDataPath);

    // Should show files selected
    await expect(adminPage.getByText(/Wybrano plików/i)).toBeVisible();

    // Click import button and wait for response
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/import') && resp.status() === 200,
        { timeout: 30000 }
      ),
      adminPage.getByRole('button', { name: /Importuj/i }).click(),
    ]);

    // Should show success message with no errors
    await expect(adminPage.getByText(/Import zakończony|sukces/i)).toBeVisible({
      timeout: 15000,
    });

    // Verify no errors were reported
    await expect(adminPage.getByText(/błąd|błędy|error/i)).not.toBeVisible();

    // Verify the imported data appears in the apartments page
    await adminPage.goto('/admin/apartments', { waitUntil: 'networkidle' });

    // Find the TEST02 card by its title
    const test02Card = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: 'TEST02' });

    // Verify the card is visible
    await expect(test02Card).toBeVisible();

    // Verify it shows 3 apartments
    await expect(test02Card.getByText('3')).toBeVisible();

    // Click "Zobacz mieszkania" button within this card
    await test02Card
      .getByRole('button', { name: /Zobacz mieszkania/i })
      .click();

    // Should see the imported apartments
    await expect(adminPage.getByText('ul. Importowa 2/1A')).toBeVisible();
  });
});
