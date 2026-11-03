import { expect, type Page } from '@playwright/test';

/**
 * Asserts that the document is not wider than the visible area, so the page
 * body does not scroll horizontally.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}
