/**
 * Admin apartment browser tests
 */

import { expect, test } from '../fixtures';

test.describe('Admin Apartment Browser', () => {
  test.describe('HOA List', () => {
    test('admin can view HOA list', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Should see the apartments/HOA heading
      await expect(
        adminPage.getByRole('heading', { name: /Mieszkania|Wspólnoty/i })
      ).toBeVisible();
    });

    test('admin sees seeded HOA', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(
        adminPage.getByRole('heading', { name: /Mieszkania|Wspólnoty/i })
      ).toBeVisible();

      // Should see TEST01 HOA from seeded data
      await expect(adminPage.getByText('TEST01')).toBeVisible();
    });

    test('HOA card shows apartment count', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // TEST01 HOA should show apartment count
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await expect(hoaCard).toBeVisible();
      // Card shows number of apartments
      await expect(hoaCard.getByText(/\d+/).first()).toBeVisible();
    });

    test('admin can click to view apartments in HOA', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Find TEST01 card and click "Zobacz mieszkania"
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Should navigate to apartments list for this HOA
      await expect(adminPage).toHaveURL(/\/admin\/apartments\/[a-f0-9-]+/);
    });
  });

  test.describe('Apartments List', () => {
    test('admin can view apartments in HOA', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Should see the seeded apartment
      await expect(adminPage.getByText('ul. Testowa 1/1A')).toBeVisible();
    });

    test('apartment list shows owner info', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Should see owner name from seeded data
      await expect(adminPage.getByText(/E2E Test User/i)).toBeVisible();
    });

    test('admin can navigate back to HOA list', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Click back arrow or navigate back
      await adminPage.goBack();

      // Should be back on HOA list
      await expect(adminPage).toHaveURL(/\/admin\/apartments$/);
    });
  });

  test.describe('Apartment Details', () => {
    test('admin can view apartment details', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Click "Zobacz szczegóły" button on apartment card
      await adminPage
        .getByRole('button', { name: /Zobacz szczegóły/i })
        .click();

      // Should navigate to apartment details
      await expect(adminPage).toHaveURL(
        /\/admin\/apartments\/[a-f0-9-]+\/[a-f0-9-]+/
      );
    });

    test('apartment details shows owner info', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Should see owner name in apartment card
      await expect(adminPage.getByText(/E2E Test User/i)).toBeVisible();
    });

    test('apartment details shows address', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Should see address in apartment card
      await expect(adminPage.getByText('ul. Testowa 1/1A')).toBeVisible();
      await expect(adminPage.getByText(/Warszawa/i)).toBeVisible();
    });

    test('apartment list shows external ID', async ({ adminPage }) => {
      await adminPage.goto('/admin/apartments');

      // Wait for page to load
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

      // Should see external ID
      await expect(adminPage.getByText(/W00001/i)).toBeVisible();
    });
  });
});
