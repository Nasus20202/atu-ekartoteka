/**
 * Visual regression tests for the admin apartment pages. The visual database
 * holds only fixed seed data, so every list shows the same rows on every run.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import {
  VISUAL_HOA_NAME,
  VISUAL_SECOND_HOA_NAME,
} from '../utils/test-credentials';

test.describe('Visual: admin apartments', () => {
  test('HOA list', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/apartments');
    await expect(
      visualAdminPage.getByText(VISUAL_SECOND_HOA_NAME)
    ).toBeVisible();
    await expect(visualAdminPage.getByText('Ładowanie')).toHaveCount(0);
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('hoa-list.png', {
      fullPage: true,
    });
  });

  test('HOA notices dialog', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/apartments');
    await visualAdminPage
      .getByRole('button', { name: 'Nagłówki i stopki' })
      .click();
    const dialog = visualAdminPage.getByRole('dialog');
    await expect(dialog.getByText(VISUAL_SECOND_HOA_NAME)).toBeVisible();
    await expect(dialog.getByText('Ładowanie')).toHaveCount(0);

    await expect(dialog).toHaveScreenshot('hoa-notices-dialog.png');
  });

  test('HOA apartments and apartment details', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/apartments');
    const hoaHref = await visualAdminPage
      .locator('.text-card-foreground')
      .filter({ hasText: VISUAL_HOA_NAME })
      .getByRole('link', { name: 'Zobacz mieszkania' })
      .getAttribute('href');

    // Open links directly, client-side navigation keeps the scroll position
    await visualAdminPage.goto(hoaHref!);
    // A frozen loading spinner is "stable" too, so wait for the data first
    await expect(
      visualAdminPage.getByRole('heading', { name: VISUAL_HOA_NAME })
    ).toBeVisible();
    await expect(visualAdminPage.getByText('Ładowanie')).toHaveCount(0);
    await expectNoHorizontalOverflow(visualAdminPage);
    await expect(visualAdminPage).toHaveScreenshot('hoa-apartments.png', {
      fullPage: true,
    });

    const apartmentHref = await visualAdminPage
      .locator('.text-card-foreground')
      .filter({ hasText: 'Bardzo Długą Nazwą' })
      .getByRole('link', { name: 'Zobacz szczegóły' })
      .getAttribute('href');
    await visualAdminPage.goto(apartmentHref!);
    await expect(visualAdminPage.getByText('Historia wpłat')).toBeVisible();
    await expect(visualAdminPage.getByText('Ładowanie')).toHaveCount(0);
    await expectNoHorizontalOverflow(visualAdminPage);
    await expect(visualAdminPage).toHaveScreenshot('apartment-details.png', {
      fullPage: true,
    });
  });
});
