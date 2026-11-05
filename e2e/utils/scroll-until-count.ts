import { expect, type Locator, type Page } from '@playwright/test';

// Each page waits for an IntersectionObserver callback and a fetch, which
// Firefox delivers slowly on a loaded CI runner
const SCROLL_LOAD_TIMEOUT_MS = 30000;
const COUNT_CHECK_TIMEOUT_MS = 1000;

/** Jumps to the page bottom; unlike mouse.wheel it ignores Firefox smooth scrolling. */
async function scrollToBottom(page: Page) {
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
}

/** Keeps scrolling an infinitely scrolled list until `items` has `count` entries. */
export async function scrollUntilCount(
  page: Page,
  items: Locator,
  count: number
) {
  await expect(async () => {
    await scrollToBottom(page);
    await expect(items).toHaveCount(count, {
      timeout: COUNT_CHECK_TIMEOUT_MS,
    });
  }).toPass({ timeout: SCROLL_LOAD_TIMEOUT_MS });
}
