/**
 * Visual regression tests for individual components
 */

import { expect, test } from '../fixtures';

test.describe('Visual: components', () => {
  test.beforeEach(async ({ visualPage }) => {
    await visualPage.goto('/dashboard');
  });

  test('navbar', async ({ visualPage }) => {
    await expect(visualPage.getByRole('navigation').first()).toHaveScreenshot(
      'navbar.png'
    );
  });

  test('notifications card', async ({ visualPage }) => {
    await expect(visualPage.locator('aside')).toHaveScreenshot(
      'notifications-card.png'
    );
  });
});

test.describe('Visual: components with two HOAs', () => {
  test('notifications card', async ({ visualMultiPage }) => {
    await visualMultiPage.goto('/dashboard');

    await expect(visualMultiPage.locator('aside')).toHaveScreenshot(
      'notifications-card-two-hoas.png'
    );
  });
});
