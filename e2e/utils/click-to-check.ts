import { expect, type Locator } from '@playwright/test';

/**
 * Clicks an option and waits for its checkbox to report checked. The click is
 * sent once: a repeated click would toggle the option back off.
 */
export async function clickToCheck(option: Locator, checkbox: Locator) {
  await option.click();
  await expect(checkbox).toBeChecked();
}
