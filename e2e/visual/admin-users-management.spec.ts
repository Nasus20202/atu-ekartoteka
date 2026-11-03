/**
 * Visual regression test for the admin account management page. The visual
 * HOA has an apartment without a user, so the create-accounts tab lists it.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import { VISUAL_HOA_NAME } from '../utils/test-credentials';

test.describe('Visual: admin users management', () => {
  test('create accounts for unassigned apartments', async ({
    visualAdminPage,
  }) => {
    await visualAdminPage.goto('/admin/users/management');
    await expect(visualAdminPage.getByText(VISUAL_HOA_NAME)).toBeVisible();
    await expect(visualAdminPage.getByText('Ładowanie')).toHaveCount(0);
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('management.png', {
      fullPage: true,
    });
  });
});
