/**
 * PDF download E2E tests - admin flows
 */

import { expect, test } from '../fixtures';

async function navigateToApartmentDetail(
  adminPage: import('@playwright/test').Page
) {
  await adminPage.goto('/admin/apartments');

  await expect(adminPage.getByText('TEST01')).toBeVisible();

  const hoaCard = adminPage
    .locator('.text-card-foreground')
    .filter({ hasText: 'TEST01' });
  await hoaCard.getByRole('button', { name: /Zobacz mieszkania/i }).click();

  await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+$/, {
    timeout: 10000,
  });

  await adminPage
    .getByRole('button', { name: /Zobacz szczegóły/i })
    .first()
    .click();

  await adminPage.waitForURL(/\/admin\/apartments\/[a-f0-9-]+\/[a-f0-9-]+$/, {
    timeout: 10000,
  });
}

test.describe('PDF Download - Admin', () => {
  test('admin apartment detail page has charges PDF button', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);

    // The Naliczenia card header contains the PDF button (second in DOM order)
    await expect(
      adminPage.getByRole('button', { name: /Pobierz PDF/i }).nth(1)
    ).toBeVisible();
  });

  test('admin can download charges PDF from apartment detail', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);

    // Click the second PDF button (charges, in Naliczenia card header)
    const downloadPromise = adminPage.waitForEvent('download');
    await adminPage
      .getByRole('button', { name: /Pobierz PDF/i })
      .nth(1)
      .click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^naliczenia-.+\.pdf$/);
  });

  test('admin apartment detail page has payment PDF button', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);

    // The Historia wpłat section contains the PDF button (first in DOM order)
    await expect(
      adminPage.getByRole('button', { name: /Pobierz PDF/i }).first()
    ).toBeVisible();
  });

  test('admin can download payment PDF from apartment detail', async ({
    adminPage,
  }) => {
    await navigateToApartmentDetail(adminPage);

    // Click the first PDF button (payment, in Historia wpłat section)
    const downloadPromise = adminPage.waitForEvent('download');
    await adminPage
      .getByRole('button', { name: /Pobierz PDF/i })
      .first()
      .click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^wplaty-.+\.pdf$/);
  });
});
