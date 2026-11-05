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

const EMAILS = {
  'verification-email': () => verificationMessage('token', RECIPIENT_NAME),
  'password-reset': () => passwordResetMessage('token', RECIPIENT_NAME),
  'account-approved': () => accountApprovedMessage(RECIPIENT_NAME),
  'account-activation': () =>
    accountActivationMessage('Tymczasowe-Haslo-42', RECIPIENT_NAME),
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
      await page.setContent(build().html);

      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
