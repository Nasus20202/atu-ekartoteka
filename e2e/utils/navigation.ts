import { expect, type Page } from '@playwright/test';

// Tailwind's md breakpoint: below it the navbar collapses behind the Menu button
const MD_BREAKPOINT_PX = 768;
const MENU_OPEN_TIMEOUT_MS = 10_000;

/**
 * Opens the navbar menu on mobile, where header links are collapsed.
 * Does nothing on desktop, where they are always visible.
 */
export async function openNavigationMenu(page: Page) {
  const viewportWidth = page.viewportSize()?.width ?? 0;
  if (viewportWidth >= MD_BREAKPOINT_PX) return;

  const toggle = page.getByRole('button', { name: 'Menu' });
  // A click before hydration does nothing, so retry until the menu reports it is open
  await expect(async () => {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }).toPass({ timeout: MENU_OPEN_TIMEOUT_MS });

  // The menu fades and grows in over a transition; clicks during it can land on links above
  const menuId = await toggle.getAttribute('aria-controls');
  await expect(page.locator(`[id="${menuId}"]`)).toHaveCSS('opacity', '1');
}

/**
 * Expands a month on a charges page, where months start collapsed.
 * Expects the month label as shown in the UI, e.g. "Październik 2026".
 */
export async function openChargesMonth(page: Page, monthYear: string) {
  // Exact label match skips PDF buttons whose names also contain the month
  await page
    .getByRole('button')
    .filter({ has: page.getByText(monthYear, { exact: true }) })
    .click();
}
