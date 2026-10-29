/**
 * Visual regression tests for components visible only on mobile
 */

import { expect, test } from '../fixtures';

test.describe('Visual: mobile components', () => {
  test('navbar with open menu', async ({ visualPage }) => {
    await visualPage.goto('/dashboard');
    await visualPage.getByRole('button', { name: 'Menu' }).click();

    await expect(visualPage.getByRole('navigation').first()).toHaveScreenshot(
      'navbar-menu-open.png'
    );
  });
});
