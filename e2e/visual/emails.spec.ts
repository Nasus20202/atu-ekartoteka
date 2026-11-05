/**
 * Visual regression tests for the HTML content of transactional emails
 */

import {
  accountActivationMessage,
  accountApprovedMessage,
  newUserAdminMessage,
  passwordResetMessage,
  verificationMessage,
} from '../../src/lib/email/email-messages';
import { expect, test } from '../fixtures';

const EMAIL_APP_URL = 'https://ekartoteka.example.com';
const RECIPIENT_NAME = 'Anna Nowak';

process.env.APP_URL = EMAIL_APP_URL;

// Emails use the recipient's system fonts, which differ per machine. Pin the
// metric-compatible fonts that ship with the Playwright browser dependencies.
const PINNED_FONTS = `
  body, body * { font-family: 'Liberation Sans', Arial, sans-serif !important; }
  body [style*='monospace'] { font-family: 'Liberation Mono', monospace !important; }
`;

const EMAILS = {
  'verification-email': () => verificationMessage('token', RECIPIENT_NAME),
  'password-reset': () => passwordResetMessage('token', RECIPIENT_NAME),
  'account-approved': () => accountApprovedMessage(RECIPIENT_NAME),
  'account-activation': () =>
    accountActivationMessage(
      'anna.nowak@example.com',
      'Tymczasowe-Haslo-42',
      RECIPIENT_NAME
    ),
  'new-user-registration-admin': () =>
    newUserAdminMessage(
      'anna.nowak@example.com',
      RECIPIENT_NAME,
      '2026-01-15 10:30'
    ),
};

test.describe('Visual: emails', () => {
  for (const [name, build] of Object.entries(EMAILS)) {
    test(`${name} email`, async ({ page }) => {
      await page.setContent((await build()).html);
      await page.addStyleTag({ content: PINNED_FONTS });

      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
