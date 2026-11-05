import { type APIRequestContext, expect, type Page } from '@playwright/test';

import { login } from '../fixtures';
import {
  TURNSTILE_INVALID_TOKEN,
  TURNSTILE_VALID_TOKEN,
} from '../mocks/constants';
import type { CapturedMail } from '../mocks/mail';

export { TURNSTILE_INVALID_TOKEN, TURNSTILE_VALID_TOKEN };
export const MOCK_URL = process.env.MOCK_URL ?? 'http://localhost:4010';

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js**';

export type MockMail = CapturedMail;

export async function waitForMail(
  request: APIRequestContext,
  to: string,
  { subject, contains }: { subject?: string; contains?: string } = {}
): Promise<MockMail> {
  let found: MockMail | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${MOCK_URL}/mail`, {
          params: { to },
        });
        const mails = (await response.json()) as MockMail[];
        found = mails.find(
          (mail) =>
            (!subject || mail.subject === subject) &&
            (!contains || mail.text.includes(contains))
        );
        return Boolean(found);
      },
      { message: `mail for ${to}` }
    )
    .toBe(true);
  return found as MockMail;
}

export function extractLink(mail: MockMail, pathname: string): string {
  const match = mail.text.match(new RegExp(`https?://\\S*${pathname}\\S*`));
  if (!match) throw new Error(`No ${pathname} link in the email`);
  return match[0];
}

export async function queueGoogleIdentity(
  request: APIRequestContext,
  identity: { email: string; name: string; sub: string }
): Promise<void> {
  await request.post(`${MOCK_URL}/google/identity`, { data: identity });
}

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

/** Signs in through the login form with the Turnstile widget stubbed. */
export async function loginWithTurnstile(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);
  await login(page, email, password);
}
