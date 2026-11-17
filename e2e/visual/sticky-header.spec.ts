/**
 * Visual regression tests for the page header once it is pinned under the navbar
 */

import { type Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { VISUAL_YEAR } from '../utils/test-credentials';

const CHARGES_MONTH_QUERY = `?month=${VISUAL_YEAR}-12`;
const SCROLL_PAST_HEADER_PX = 360;
// Snapshots turn the navbar static so tall screenshots do not draw it over the
// page. Here the navbar must stay pinned, with the header sitting right under it.
const PINNED_NAVBAR_CSS =
  'html body nav.sticky { position: sticky !important; }';

async function openScrolledChargesDetails(page: Page) {
  await page.goto('/dashboard');
  const chargesHref = await page
    .getByRole('link', { name: 'Naliczenia', exact: true })
    .getAttribute('href');
  await page.goto(`${chargesHref}${CHARGES_MONTH_QUERY}`);
  await expect(page).toHaveURL(/\/dashboard\/charges\/[\w-]+/);

  await page.addStyleTag({ content: PINNED_NAVBAR_CSS });
  await page.evaluate((y) => window.scrollTo(0, y), SCROLL_PAST_HEADER_PX);
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
