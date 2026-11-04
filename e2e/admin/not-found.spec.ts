/**
 * Admin not-found pages for unknown associations and apartments
 */

import { expect, test } from '../fixtures';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Admin not-found pages', () => {
  test('unknown association shows the HOA 404', async ({ adminPage }) => {
    await adminPage.goto(`/admin/apartments/${MISSING_ID}`);

    await expect(
      adminPage.getByRole('heading', { name: 'Wspólnota nie znaleziona' })
    ).toBeVisible();
    await adminPage.getByRole('link', { name: 'Powrót do wspólnot' }).click();
    await expect(adminPage).toHaveURL(/\/admin\/apartments$/);
  });

  test('unknown apartment in a real association shows the apartment 404', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/apartments');
    // Association links are one segment deep; apartment links are two
    const hoaHref = await adminPage
      .locator('a[href^="/admin/apartments/"]')
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href'))
          .find((href) => /^\/admin\/apartments\/[^/]+$/.test(href ?? ''))
      );
    expect(hoaHref).toBeTruthy();

    await adminPage.goto(`${hoaHref}/${MISSING_ID}`);

    await expect(
      adminPage.getByRole('heading', { name: 'Mieszkanie nie znalezione' })
    ).toBeVisible();
  });
});
