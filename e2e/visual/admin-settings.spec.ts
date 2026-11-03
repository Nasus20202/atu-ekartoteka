/**
 * Visual regression test for the admin settings page.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';

test.describe('Visual: admin settings', () => {
  test('settings page', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/settings');
    await expect(
      visualAdminPage.getByText('Historia dla mieszkańców')
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('settings.png', {
      fullPage: true,
    });
  });
});
