import type { Page } from '@playwright/test';

export const TURNSTILE_SCRIPT_URL = (url: URL) =>
  url.href.includes('challenges.cloudflare.com/turnstile/v0/api.js');

/** Replaces the Cloudflare widget with one that answers with the given token. */
export async function stubTurnstileWidget(
  page: Page,
  token: string
): Promise<void> {
  await page.route(TURNSTILE_SCRIPT_URL, (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.turnstile = {
          render(container, options) {
            setTimeout(() => options.callback && options.callback(${JSON.stringify(token)}), 0);
            return 'mock-widget';
          },
          reset() {},
          remove() {},
          getResponse() { return ${JSON.stringify(token)}; },
          isExpired() { return false; },
        };
        const onload = new URLSearchParams(document.currentScript.src.split('?')[1]).get('onload');
        if (onload && window[onload]) window[onload]();
      `,
    })
  );
}
