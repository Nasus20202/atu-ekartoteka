/**
 * Sticky page header - the back button stays visible while the page scrolls
 */

import { expect, test } from '../fixtures';

// The payments page is only a little taller than a 420px viewport, and the
// header sticks only once the page has scrolled past the navbar. A shorter
// viewport gives the scroll real room, so a single scroll always reaches it.
const SHORT_VIEWPORT = { width: 1280, height: 360 };
const NAVBAR_BOTTOM_PX = 65;

test.describe('Sticky page header', () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test('back button stays visible below the navbar after scrolling', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/payments');
    const header = userPage.locator('[data-stuck]').first();
    const backButton = userPage.getByRole('button', { name: 'Wróć' });

    await expect(header).toHaveAttribute('data-stuck', 'false');

    await userPage.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await expect(header).toHaveAttribute('data-stuck', 'true');

    const box = await backButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(NAVBAR_BOTTOM_PX - 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(SHORT_VIEWPORT.height);
  });

  test('header returns to its resting look at the top', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/payments');
    const header = userPage.locator('[data-stuck]').first();

    await userPage.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await expect(header).toHaveAttribute('data-stuck', 'true');

    await userPage.evaluate(() => window.scrollTo(0, 0));
    await expect(header).toHaveAttribute('data-stuck', 'false');
  });
});
