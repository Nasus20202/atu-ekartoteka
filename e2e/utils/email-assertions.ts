import { expect } from '@playwright/test';

import type { MockMail } from './mock-server';

export const INTEGRATIONS_APP_URL =
  process.env.PLAYWRIGHT_INTEGRATIONS_BASE_URL ?? 'http://localhost:3002';
export const SENDER_ADDRESS = 'noreply@ekartoteka.test';

const URL_PATTERN = /https?:\/\/[^\s"<>]+/g;
const UNRESOLVED_PLACEHOLDER = '{{';
const BRAND_NAME = 'ATU Ekartoteka';
const PRIMARY_COLOR = '#2563eb';

interface ExpectedEmail {
  to: string;
  subject: string;
  /** Present in both the HTML and the plain-text part */
  both: string[];
  /** Only the HTML part carries these, e.g. button labels */
  html?: string[];
  /** Only the plain-text part carries these */
  text?: string[];
  /** Path of the call-to-action link, which both parts must contain */
  linkPath?: string;
}

/** Asserts a message the app really sent over SMTP, headers and both bodies. */
export function expectDeliveredEmail(
  mail: MockMail,
  { to, subject, both, html = [], text = [], linkPath }: ExpectedEmail
): void {
  expect(mail.to).toContain(to.toLowerCase());
  expect(mail.from).toContain(SENDER_ADDRESS);
  expect(mail.subject).toBe(subject);

  for (const body of [mail.html, mail.text]) {
    expect(body).not.toBe('');
    expect(body).not.toContain(UNRESOLVED_PLACEHOLDER);
    for (const fragment of both) expect(body).toContain(fragment);
  }
  for (const fragment of html) expect(mail.html).toContain(fragment);
  for (const fragment of text) expect(mail.text).toContain(fragment);

  expect(mail.html).toContain(BRAND_NAME);
  expect(mail.html).toContain(PRIMARY_COLOR);

  const htmlLinks = mail.html.match(URL_PATTERN) ?? [];
  expect(htmlLinks.length).toBeGreaterThan(0);
  for (const link of htmlLinks) {
    expect(link.startsWith(INTEGRATIONS_APP_URL)).toBe(true);
    expect(mail.text).toContain(link);
  }
  if (linkPath) {
    expect(mail.html).toContain(`${INTEGRATIONS_APP_URL}${linkPath}`);
    expect(mail.text).toContain(`${INTEGRATIONS_APP_URL}${linkPath}`);
  }
}
