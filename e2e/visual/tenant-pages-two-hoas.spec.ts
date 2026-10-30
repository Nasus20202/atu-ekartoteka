/**
 * Visual regression tests for a tenant with apartments in two HOAs,
 * where pages group data per HOA and apartment
 */

import { expect, test } from '../fixtures';
import { VISUAL_YEAR } from '../utils/test-credentials';

const PAGES = [
  { name: 'dashboard', path: '/dashboard' },
  // Charges months start collapsed, so open the last seeded one to show its details
  { name: 'charges', path: `/dashboard/charges?month=${VISUAL_YEAR}-12` },
  { name: 'payments', path: '/dashboard/payments' },
] as const;

test.describe('Visual: tenant pages with two HOAs', () => {
  for (const { name, path } of PAGES) {
    test(name, async ({ visualMultiPage }) => {
      await visualMultiPage.goto(path);

      await expect(visualMultiPage).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
      });
    });
  }
});
