/**
 * Visual regression tests for the tenant settlements page, on desktop and
 * phone (see seed-visual-test-data.ts)
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';

const VIEWS = [
  { tab: 'Media', file: 'media' },
  { tab: 'Liczniki', file: 'meters' },
  { tab: 'Koszty rzeczywiste', file: 'annual' },
];

async function openView(page: Page, tab: string) {
  await page.getByRole('tab', { name: tab }).click();
  if (tab === 'Media') {
    // One card is expanded, so the line table is covered too
    await page
      .getByRole('region', { name: 'Ciepła woda (CW)' })
      .getByRole('button', { name: 'Szczegóły' })
      .click();
  }
  await expect(page.getByRole('tabpanel')).toBeVisible();
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Visual: tenant settlements, ${scheme}`, () => {
    for (const { tab, file } of VIEWS) {
      test(tab, async ({ visualPage }) => {
        await visualPage.emulateMedia({ colorScheme: scheme });
        await visualPage.goto('/dashboard/settlements');

        await openView(visualPage, tab);
        await expectNoHorizontalOverflow(visualPage);

        await expect(visualPage).toHaveScreenshot(
          `settlements-${file}-${scheme}.png`,
          { fullPage: true }
        );
      });
    }
  });
}
