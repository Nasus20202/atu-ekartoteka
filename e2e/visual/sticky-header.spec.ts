/**
 * Visual regression tests for the page header once it is pinned under the navbar
 */

import { type Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { waitForScrollSettled } from '../utils/scroll';
import { VISUAL_YEAR } from '../utils/test-credentials';

const CHARGES_MONTH_QUERY = `?month=${VISUAL_YEAR}-12`;
// Snapshots turn the navbar static so tall screenshots do not draw it over the
// page. Here the navbar must stay pinned, with the header sitting right under it.
const PINNED_NAVBAR_CSS =
  'html body nav.sticky { position: sticky !important; }';

/**
 * The month in the URL is scrolled under the navbar by the app itself. That
 * scroll is the position the snapshot expects, so wait for it to happen and
 * finish instead of scrolling the page a second time.
 */
async function openScrolledChargesDetails(page: Page) {
  await page.goto('/dashboard');
  const chargesHref = await page
    .getByRole('link', { name: 'Naliczenia', exact: true })
    .getAttribute('href');
  await page.goto(`${chargesHref}${CHARGES_MONTH_QUERY}`);
  await expect(page).toHaveURL(/\/dashboard\/charges\/[\w-]+/);

  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeGreaterThan(0);
  await waitForScrollSettled(page);

  await page.addStyleTag({ content: PINNED_NAVBAR_CSS });
  await expect(page.locator('[data-stuck]')).toHaveAttribute(
    'data-stuck',
    'true'
  );
}

test.describe('Visual: sticky page header', () => {
  test('header pinned under the navbar', async ({ visualPage }) => {
    await openScrolledChargesDetails(visualPage);

    await expect(visualPage).toHaveScreenshot('sticky-header.png');
  });

  test('header pinned under the navbar in dark mode', async ({
    visualPage,
  }) => {
    await visualPage.emulateMedia({ colorScheme: 'dark' });
    await openScrolledChargesDetails(visualPage);

    await expect(visualPage).toHaveScreenshot('sticky-header-dark.png');
  });
});
