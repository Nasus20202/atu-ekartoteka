/**
 * The admin chrome fits every width: the navbar collapses into the menu on
 * tablets, the pinned header wraps its controls and each page opens at the top.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';

const TABLET_VIEWPORT = { width: 800, height: 900 };
const PHONE_VIEWPORT = { width: 360, height: 700 };
const TALL_MAIN_PX = '3000px';
const SCROLLED_PX = 60;
const NAVBAR_HEIGHT_PX = 65;

test.describe('Admin layout', () => {
  test('navbar does not overflow at tablet width', async ({ adminPage }) => {
    await adminPage.setViewportSize(TABLET_VIEWPORT);
    await adminPage.goto('/admin/apartments');

    await expect(adminPage.getByRole('button', { name: 'Menu' })).toBeVisible();
    await expectNoHorizontalOverflow(adminPage);
  });

  test('closed menu adds no height to the navbar', async ({ adminPage }) => {
    await adminPage.setViewportSize(PHONE_VIEWPORT);
    await adminPage.goto('/admin/apartments');

    const navbar = await adminPage.locator('nav').boundingBox();
    expect(navbar!.height).toBe(NAVBAR_HEIGHT_PX);
  });

  test('header controls wrap on a phone', async ({ adminPage }) => {
    await adminPage.setViewportSize(PHONE_VIEWPORT);
    await adminPage.goto('/admin/apartments');
    await adminPage.locator('a[href^="/admin/apartments/"]').first().click();

    await expect(adminPage.getByText('Tylko aktywne')).toBeVisible();
    await expectNoHorizontalOverflow(adminPage);
  });

  test('a new page opens at the top', async ({ adminPage }) => {
    await adminPage.setViewportSize(PHONE_VIEWPORT);
    await adminPage.goto('/admin/apartments');
    await adminPage.evaluate(
      ([minHeight, top]) => {
        const main = document.querySelector('main') as HTMLElement;
        main.style.minHeight = minHeight as string;
        window.scrollTo(0, top as number);
      },
      [TALL_MAIN_PX, SCROLLED_PX]
    );

    // A click that lands while the list is still hydrating can be swallowed,
    // so retry until the new page is actually open
    await expect(async () => {
      await adminPage.locator('a[href^="/admin/apartments/"]').first().click();
      await expect(adminPage).toHaveURL(/\/admin\/apartments\/[\w-]+/, {
        timeout: 5000,
      });
    }).toPass({ timeout: 10_000 });
    await expect(adminPage.getByText('Tylko aktywne')).toBeVisible();

    expect(await adminPage.evaluate(() => window.scrollY)).toBe(0);
  });
});
