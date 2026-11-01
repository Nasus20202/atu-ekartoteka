/**
 * Below the lg breakpoint the dashboard notification details are collapsed
 * behind a toggle; on large screens the toggle is not shown.
 */

import type { Page } from '@playwright/test';

const SHOW_DETAILS_LABEL = 'Pokaż szczegóły powiadomień';

export async function expandNotifications(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: SHOW_DETAILS_LABEL });

  if (await toggle.isVisible()) {
    await toggle.click();
  }
}
