import { expect, type Locator } from '@playwright/test';

const CHECKED_TIMEOUT_MS = 2000;

/**
 * Clicks an option until its checkbox reports checked. The click is repeated
 * only while the box is still unchecked, so a retry does not toggle it back
 * off.
 */
export async function clickToCheck(option: Locator, checkbox: Locator) {
  await expect(async () => {
    if (!(await checkbox.isChecked())) await option.click();
    await expect(checkbox).toBeChecked({ timeout: CHECKED_TIMEOUT_MS });
  }).toPass();
}
