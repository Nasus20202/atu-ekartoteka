/**
 * PDF download E2E tests - admin flows
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { CURRENT_MONTH_YEAR } from '../utils/date-utils';

const CHARGES_PDF_BUTTON = { name: /Pobierz PDF naliczeń/i };
const PAYMENT_PDF_BUTTON = { name: /Pobierz PDF wpłat/i };

// Charges PDF buttons live inside the expanded month, like on tenant pages
async function expandCurrentChargesMonth(
  adminPage: import('@playwright/test').Page
) {
  await adminPage
    .getByRole('button', { name: new RegExp(CURRENT_MONTH_YEAR) })
    .click();
}

async function navigateToApartmentDetail(adminPage: Page) {
  await adminPage.goto('/admin/apartments');

  // Open the resolved links directly: the list cards overflow narrow viewports
  // and their buttons are unreliable click targets on mobile.
  const hoaHref = await adminPage
    .locator('.text-card-foreground')
    .filter({ hasText: 'TEST01' })
    .getByRole('link', { name: /Zobacz mieszkania/i })
    .getAttribute('href');

  await adminPage.goto(hoaHref!);

  const apartmentHref = await adminPage
    .getByRole('link', { name: /Zobacz szczegóły/i })
    .first()
    .getAttribute('href');

  await adminPage.goto(apartmentHref!);
}

test.describe('PDF Download - Admin', () => {
  test('admin apartment detail page has charges PDF button', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);
    await expandCurrentChargesMonth(adminPage);

    await expect(
      adminPage.getByRole('button', CHARGES_PDF_BUTTON)
    ).toBeVisible();
  });

  test('admin can download charges PDF from apartment detail', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);
    await expandCurrentChargesMonth(adminPage);

    const downloadPromise = adminPage.waitForEvent('download');
    await adminPage.getByRole('button', CHARGES_PDF_BUTTON).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^naliczenia-.+\.pdf$/);
  });

  test('admin apartment detail page has payment PDF button', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);

    await expect(
      adminPage.getByRole('button', PAYMENT_PDF_BUTTON)
    ).toBeVisible();
  });

  test('admin can download payment PDF from apartment detail', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);

    const downloadPromise = adminPage.waitForEvent('download');
    await adminPage.getByRole('button', PAYMENT_PDF_BUTTON).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^wplaty-.+\.pdf$/);
  });
});
