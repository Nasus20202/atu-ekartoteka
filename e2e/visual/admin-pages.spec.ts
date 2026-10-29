/**
 * Visual regression tests for admin pages that show only the visual seed data.
 * Lists of all HOAs and users change with parallel tests, so they are skipped.
 */

import { expect, test } from '../fixtures';
import { VISUAL_HOA_NAME } from '../utils/test-credentials';

test.describe('Visual: admin pages', () => {
  test('HOA apartments and apartment details', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/apartments');
    const hoaHref = await visualAdminPage
      .locator('.text-card-foreground')
      .filter({ hasText: VISUAL_HOA_NAME })
      .getByRole('link', { name: 'Zobacz mieszkania' })
      .getAttribute('href');

    // Open links directly, client-side navigation keeps the scroll position
    await visualAdminPage.goto(hoaHref!);
    await expect(visualAdminPage).toHaveScreenshot('hoa-apartments.png', {
      fullPage: true,
    });

    const apartmentHref = await visualAdminPage
      .locator('.text-card-foreground')
      .filter({ hasText: 'Bardzo Długą Nazwą' })
      .getByRole('link', { name: 'Zobacz szczegóły' })
      .getAttribute('href');
    await visualAdminPage.goto(apartmentHref!);
    await expect(visualAdminPage).toHaveScreenshot('apartment-details.png', {
      fullPage: true,
    });
  });

  test('import page', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/import');

    await expect(visualAdminPage).toHaveScreenshot('import.png', {
      fullPage: true,
      // Database totals change with parallel tests
      mask: [visualAdminPage.getByRole('table')],
    });
  });
});
