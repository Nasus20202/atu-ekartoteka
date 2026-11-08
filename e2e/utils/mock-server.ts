import { type APIRequestContext, expect, type Page } from '@playwright/test';

import { login } from '../fixtures';
import {
  TURNSTILE_INVALID_TOKEN,
  TURNSTILE_VALID_TOKEN,
} from '../mocks/constants';
import type { CapturedMail } from '../mocks/mail-store';
import { stubTurnstileWidget, TURNSTILE_SCRIPT_URL } from './turnstile-stub';

export { stubTurnstileWidget } from './turnstile-stub';
export { TURNSTILE_INVALID_TOKEN, TURNSTILE_VALID_TOKEN };
export const MOCK_URL = process.env.MOCK_URL ?? 'http://localhost:4010';

const FAKE_TURNSTILE_SCRIPT_URL = new URL(
  './fake-turnstile-widget.js',
  import.meta.url
);

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

const LINK_PATTERN = /https?:\/\/\S+/g;

export function extractLink(mail: MockMail, pathname: string): string {
  const link = mail.text
    .match(LINK_PATTERN)
    ?.find((candidate) => candidate.includes(pathname));
  if (!link) throw new Error(`No ${pathname} link in the email`);
  return link;
}

export async function queueGoogleIdentity(
  request: APIRequestContext,
  identity: { email: string; name: string; sub: string }
): Promise<void> {
  await request.post(`${MOCK_URL}/google/identity`, { data: identity });
}

/**
 * Replaces the Cloudflare widget with a visible, deterministic fake so visual
 * snapshots show the challenge slot. It never solves itself, so the snapshot
 * does not depend on a token being set.
 */
export async function stubVisibleTurnstileWidget(page: Page): Promise<void> {
  await page.route(TURNSTILE_SCRIPT_URL, (route) =>
    route.fulfill({ path: FAKE_TURNSTILE_SCRIPT_URL.pathname })
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
