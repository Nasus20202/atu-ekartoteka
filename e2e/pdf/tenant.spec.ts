/**
 * PDF download E2E tests - tenant flows
 */

import { expect, test } from '../fixtures';

async function getApartmentIdFromPaymentsPage(
  userPage: import('@playwright/test').Page
): Promise<string> {
  await userPage.goto('/dashboard/payments');
  const currentYear = new Date().getFullYear();
  await userPage.getByText(`Rok ${currentYear}`).click();
  await userPage.waitForURL(/\/dashboard\/payments\/[a-f0-9-]+\/\d{4}/, {
    timeout: 10000,
  });
  const url = userPage.url();
  const match = url.match(/\/dashboard\/payments\/([a-f0-9-]+)\/\d{4}/);
  if (!match) throw new Error(`Could not extract apartmentId from URL: ${url}`);
  return match[1];
}

test.describe('PDF Download - Tenant', () => {
  test.describe('Charges PDF', () => {
    test('charges detail page has PDF download button', async ({
      userPage,
    }) => {
      const apartmentId = await getApartmentIdFromPaymentsPage(userPage);

      await userPage.goto(`/dashboard/charges/${apartmentId}`);
      await expect(
        userPage.getByRole('button', { name: /Pobierz PDF/i }).first()
      ).toBeVisible();
    });

    test('tenant can download charges PDF', async ({ userPage }) => {
      const apartmentId = await getApartmentIdFromPaymentsPage(userPage);

      await userPage.goto(`/dashboard/charges/${apartmentId}`);
      await expect(
        userPage.getByRole('button', { name: /Pobierz PDF/i }).first()
      ).toBeVisible();

      const downloadPromise = userPage.waitForEvent('download');
      await userPage
        .getByRole('button', { name: /Pobierz PDF/i })
        .first()
        .click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/^naliczenia-.+\.pdf$/);
    });
  });

  test.describe('Payments PDF', () => {
    test('payment detail page has PDF download button', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard/payments');

      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).click();

      await userPage.waitForURL(/\/dashboard\/payments\/[a-f0-9-]+\/\d{4}/, {
        timeout: 10000,
      });

      await expect(
        userPage.getByRole('button', { name: /Pobierz PDF/i })
      ).toBeVisible();
    });

    test('tenant can download payment PDF', async ({ userPage }) => {
      await userPage.goto('/dashboard/payments');

      const currentYear = new Date().getFullYear();
      await userPage.getByText(`Rok ${currentYear}`).click();

      await userPage.waitForURL(/\/dashboard\/payments\/[a-f0-9-]+\/\d{4}/, {
        timeout: 10000,
      });

      const downloadPromise = userPage.waitForEvent('download');
      await userPage.getByRole('button', { name: /Pobierz PDF/i }).click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/^wplaty-.+\.pdf$/);
    });
  });
});
