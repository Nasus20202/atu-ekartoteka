/**
 * The admin chrome fits every width: the navbar collapses into the menu on
 * tablets, the pinned header wraps its controls and each page opens at the top.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { cardWithText, openHoaList, TEST_HOA } from '../utils/admin-apartments';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';

const TABLET_VIEWPORT = { width: 800, height: 900 };
const PHONE_VIEWPORT = { width: 360, height: 700 };
const TALL_MAIN_PX = '3000px';
const SCROLLED_PX = 60;
const NAVBAR_HEIGHT_PX = 65;
const HOA_PAGE_PATH = /\/admin\/apartments\/[a-f0-9-]+\/?$/;
const APARTMENTS_TOGGLE = 'Tylko aktywne';

/**
 * Opens the seeded HOA instead of the first card: the list also shows the
 * temporary HOAs that other specs create and delete while this one runs, so
 * the first link can point at a HOA that is already gone when it is clicked.
 * The click can also land before the list hydrates; it is then dropped, the
 * card stays on the page and the retry clicks it again.
 */
async function openSeededHoa(page: Page) {
  await expect(async () => {
    await cardWithText(page, TEST_HOA)
      .getByRole('button', { name: /Zobacz mieszkania/i })
      .click();
    await expect(page).toHaveURL(HOA_PAGE_PATH, { timeout: 5000 });
  }).toPass({ timeout: 20_000 });

  // The apartments page streams in, so its content is waited for separately
  await expect(page.getByText(APARTMENTS_TOGGLE)).toBeVisible({
    timeout: 15_000,
  });
}

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
    await openHoaList(adminPage);
    await openSeededHoa(adminPage);

    await expectNoHorizontalOverflow(adminPage);
  });

  test('a new page opens at the top', async ({ adminPage }) => {
    await adminPage.setViewportSize(PHONE_VIEWPORT);
    await openHoaList(adminPage);
    await adminPage.evaluate(
      ([minHeight, top]) => {
        const main = document.querySelector('main') as HTMLElement;
        main.style.minHeight = minHeight as string;
        window.scrollTo(0, top as number);
      },
      [TALL_MAIN_PX, SCROLLED_PX]
    );
    expect(await adminPage.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    // The click happens while the page is scrolled, so the helper also proves
    // the navigation was not lost before the scroll position is checked
    await openSeededHoa(adminPage);

    expect(await adminPage.evaluate(() => window.scrollY)).toBe(0);
  });
});
