import type { Page } from '@playwright/test';

// Smooth scroll animations move for a few hundred milliseconds; ten frames
// without movement mean the page has come to rest
const SETTLE_FRAMES = 10;
const SETTLE_TIMEOUT_MS = 5000;

/**
 * Waits until the page stops scrolling, so a snapshot or a programmatic scroll
 * does not race an animation the app starts on its own (for example a deep
 * link that scrolls the active month into view). `minimumMs` covers the delay
 * between mount and such an animation starting.
 */
export async function waitForScrollSettled(
  page: Page,
  minimumMs = 0
): Promise<void> {
  await page.evaluate(
    async ({ frames, minimum, timeoutMs }) => {
      const raf = () =>
        new Promise((resolve) => requestAnimationFrame(resolve));
      const start = performance.now();
      while (performance.now() - start < minimum) await raf();

      const deadline = performance.now() + timeoutMs;
      let last = window.scrollY;
      let stable = 0;
      while (performance.now() < deadline && stable < frames) {
        await raf();
        const next = window.scrollY;
        stable = next === last ? stable + 1 : 0;
        last = next;
      }
    },
    { frames: SETTLE_FRAMES, minimum: minimumMs, timeoutMs: SETTLE_TIMEOUT_MS }
  );
}
