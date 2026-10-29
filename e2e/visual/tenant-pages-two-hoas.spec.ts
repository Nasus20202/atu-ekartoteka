/**
 * Visual regression tests for a tenant with apartments in two HOAs,
 * where pages group data per HOA and apartment
 */

import { expect, test } from '../fixtures';

const PAGES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'charges', path: '/dashboard/charges' },
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
