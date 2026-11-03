/**
 * Visual regression test for the admin import page.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';

test.describe('Visual: admin import', () => {
  test('import page', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/import');
    await expect(visualAdminPage.getByRole('table')).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('import.png', {
      fullPage: true,
      // The database statistics table shows totals that other tests may change
      mask: [visualAdminPage.getByRole('table')],
    });
  });
});
