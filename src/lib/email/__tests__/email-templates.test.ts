import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  accountActivationMessage,
  accountApprovedMessage,
  type EmailMessage,
  newUserAdminMessage,
  passwordResetMessage,
  verificationMessage,
} from '@/lib/email/email-messages';

const APP_URL = 'https://ekartoteka.example.com';
const EVIL_NAME = '<script>alert("x")</script>';
const LINK_PATTERN = /href="(https?:\/\/[^"]+)"/g;

function linksOf(html: string): string[] {
  return [...html.matchAll(LINK_PATTERN)].map((match) => match[1]);
}
const PRIMARY_COLOR = '#2563eb';

const MESSAGES: Record<string, () => Promise<EmailMessage>> = {
  verification: () => verificationMessage('tok-1', 'Anna'),
  passwordReset: () => passwordResetMessage('tok-2', 'Anna'),
  accountApproved: () => accountApprovedMessage('Anna'),
  accountActivation: () =>
    accountActivationMessage('anna@example.com', 'Temp-Pass-1', 'Anna'),
  newUserAdmin: () =>
    newUserAdminMessage('anna@example.com', 'Anna Nowak', '2026-01-02 10:00'),
};

describe('email templates', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', APP_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe.each(Object.entries(MESSAGES))('%s', (_name, build) => {
    it('leaves no placeholders behind', async () => {
      const { html, text, subject } = await build();

      for (const content of [html, text, subject]) {
        expect(content).not.toMatch(/{{[A-Z_]+}}/);
      }
    });

    it('links to the application with absolute urls', async () => {
      const urls = linksOf((await build()).html);

      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(url.startsWith(APP_URL)).toBe(true);
      }
    });

    it('contains every link of the html in the text variant', async () => {
      const { html, text } = await build();
      const htmlUrls = new Set(linksOf(html));

      for (const url of htmlUrls) {
        expect(text).toContain(url);
      }
    });

    it('uses the shared site style', async () => {
      const { html } = await build();

      expect(html).toContain('lang="pl"');
      expect(html).toContain('ATU Ekartoteka');
      expect(html).toContain(PRIMARY_COLOR);
      expect(html).toContain('width="100%"');
      expect(html).not.toContain('#f4f4f4');
    });
  });

  it('escapes user supplied values in html but not in text', async () => {
    const verification = await verificationMessage('t', EVIL_NAME);
    const admin = await newUserAdminMessage('a@b.pl', EVIL_NAME, 'date');

    expect(verification.html).not.toContain('<script>');
    expect(admin.html).not.toContain('<script>');
    expect(verification.html).toContain('&lt;script&gt;');
    expect(verification.text).toContain(EVIL_NAME);
  });

  it('puts each token in its link', async () => {
    expect((await verificationMessage('tok-1')).html).toContain(
      `${APP_URL}/verify-email?token=tok-1`
    );
    expect((await passwordResetMessage('tok-2')).html).toContain(
      `${APP_URL}/reset-password?token=tok-2`
    );
  });

  it('shows the temporary password and the registration details', async () => {
    const activation = await accountActivationMessage(
      'anna@example.com',
      'Temp-Pass-1'
    );
    const admin = await newUserAdminMessage('a@b.pl', 'Anna', '2026-01-02');

    for (const content of [activation.html, activation.text]) {
      expect(content).toContain('anna@example.com');
      expect(content).toContain('Temp-Pass-1');
    }
    for (const value of ['a@b.pl', 'Anna', '2026-01-02']) {
      expect(admin.html).toContain(value);
      expect(admin.text).toContain(value);
    }
  });

  it('keeps the subjects stable', async () => {
    expect((await verificationMessage('t')).subject).toBe(
      'Potwierdź swój adres email'
    );
    expect((await passwordResetMessage('t')).subject).toBe('Resetowanie hasła');
    expect((await accountApprovedMessage()).subject).toBe(
      'Twoje konto zostało zatwierdzone'
    );
  });
});
