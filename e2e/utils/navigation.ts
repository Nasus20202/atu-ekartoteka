import type { Page } from '@playwright/test';

/**
 * Opens the navbar menu on mobile, where header links are collapsed.
 * Does nothing on desktop, where they are always visible.
 */
export async function openNavigationMenu(page: Page) {
  const toggle = page.getByRole('button', { name: 'Menu' });

  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

/**
 * Expands a month on a charges page, where months start collapsed.
 * Expects the month label as shown in the UI, e.g. "Październik 2026".
 */
export async function openChargesMonth(page: Page, monthYear: string) {
  await page
    .getByRole('button', { name: new RegExp(`^${monthYear}`, 'i') })
    .click();
}
