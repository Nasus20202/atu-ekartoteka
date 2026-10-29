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
