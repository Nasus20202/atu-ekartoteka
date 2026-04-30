/**
 * Admin apartment browser tests
 */

import { expect, test } from '../fixtures';
import { createTwinUnassignedApartment } from '../utils/create-twin-unassigned-apartment';
import { deleteApartment } from '../utils/delete-apartment';
import { setHoaImportDates } from '../utils/set-hoa-import-dates';

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

    test('HOA card shows import dates when set', async ({ adminPage }) => {
      await setHoaImportDates('2025-03-15T00:00:00.000Z');

      try {
        await adminPage.goto('/admin/apartments');
        await expect(adminPage.getByText('TEST01')).toBeVisible();

        const hoaCard = adminPage.locator('.text-card-foreground').filter({
          hasText: 'TEST01',
        });

        // Dates should appear in Polish locale format (15.03.2025)
        await expect(hoaCard.getByText(/Mieszkania:/i)).toBeVisible({
          timeout: 5000,
        });
        await expect(hoaCard.getByText(/Naliczenia:/i)).toBeVisible();
        await expect(hoaCard.getByText(/Powiadomienia:/i)).toBeVisible();
      } finally {
        await setHoaImportDates(null);
      }
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

      // Click "Zobacz szczegóły" button on the seeded apartment card
      const apartmentCard = adminPage
        .locator('.text-card-foreground')
        .filter({ hasText: 'ul. Testowa 1/1A' });
      await apartmentCard
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

      // Wait for navigation to the apartments list
      await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
        timeout: 10000,
      });

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

      // Wait for navigation to the apartments list
      await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
        timeout: 10000,
      });

      // Scope to the seeded apartment card to avoid interference from other apartments
      const apartmentCard = adminPage
        .locator('.text-card-foreground')
        .filter({ hasText: 'ul. Testowa 1/1A' });

      // Should see address in apartment card
      await expect(apartmentCard.getByText('ul. Testowa 1/1A')).toBeVisible();
      await expect(apartmentCard.getByText(/Warszawa/i)).toBeVisible();
    });

    test('apartment details shows monthly chart section inside payment history', async ({
      adminPage,
    }) => {
      await adminPage.goto('/admin/apartments');
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();
      await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
        timeout: 10000,
      });

      const apartmentCard = adminPage
        .locator('.text-card-foreground')
        .filter({ hasText: 'ul. Testowa 1/1A' });
      await apartmentCard
        .getByRole('button', { name: /Zobacz szczegóły/i })
        .click();

      await expect(
        adminPage.getByText(/Wykres rozliczeń miesięcznych/i).first()
      ).toBeVisible();
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

      // Wait for navigation to the apartments list
      await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
        timeout: 10000,
      });

      // Should see external ID
      await expect(adminPage.getByText(/W00001/i)).toBeVisible();
    });
  });

  test.describe('Slash Search', () => {
    test('searching "1/1A" filters apartments by building and number', async ({
      adminPage,
    }) => {
      await adminPage.goto('/admin/apartments');
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      // Navigate to TEST01 HOA apartments
      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();
      await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
        timeout: 10000,
      });

      // Enter "1/1A" in the search field — splits on "/" into building=1, number=1A
      const searchInput = adminPage.getByPlaceholder('Wyszukaj...');
      await searchInput.fill('1/1A');
      await adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/apartments') &&
          resp.url().includes('search=') &&
          resp.status() === 200
      );
      await adminPage.getByRole('button', { name: /Szukaj/i }).click();

      // Wait for results to update
      await adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/apartments') && resp.status() === 200
      );

      // Seeded apartment (building=1, number=1A) should be visible
      await expect(adminPage.getByText('ul. Testowa 1/1A').first()).toBeVisible(
        { timeout: 5000 }
      );
    });

    test('searching a non-matching term shows empty state', async ({
      adminPage,
    }) => {
      await adminPage.goto('/admin/apartments');
      await expect(adminPage.getByText('TEST01')).toBeVisible();

      const hoaCard = adminPage.locator('.text-card-foreground').filter({
        hasText: 'TEST01',
      });
      await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();
      await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
        timeout: 10000,
      });

      const searchInput = adminPage.getByPlaceholder('Wyszukaj...');
      await searchInput.fill('ZZZNOMATCH999');
      await adminPage.getByRole('button', { name: /Szukaj/i }).click();

      await adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/apartments') && resp.status() === 200
      );

      await expect(adminPage.getByText(/Nie znaleziono mieszkań/i)).toBeVisible(
        { timeout: 5000 }
      );
    });
  });

  test.describe('Duplicate Address Badge', () => {
    test('shows "Duplikat adresu" badge when two active apartments share the same address', async ({
      adminPage,
    }) => {
      // Create a second apartment with the same building/number as the seeded one
      const { id: twinId } = await createTwinUnassignedApartment();

      try {
        await adminPage.goto('/admin/apartments');
        await expect(adminPage.getByText('TEST01')).toBeVisible();

        const hoaCard = adminPage.locator('.text-card-foreground').filter({
          hasText: 'TEST01',
        });
        await hoaCard
          .getByRole('button', { name: /Zobacz mieszkania/i })
          .click();
        await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
          timeout: 10000,
        });

        // Both apartments with address ul. Testowa 1/1A should show the badge
        await expect(
          adminPage.getByText('Duplikat adresu').first()
        ).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteApartment(twinId);
      }
    });
  });
});
