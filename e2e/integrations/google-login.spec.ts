/**
 * Google sign-in runs through the local OpenID provider mock.
 */

import { randomUUID } from 'crypto';

import { expect, test } from '../fixtures';
import { createCredentialsUser } from '../utils/create-credentials-user';
import {
  queueGoogleIdentity,
  stubTurnstileWidget,
  TURNSTILE_VALID_TOKEN,
  waitForMail,
} from '../utils/mock-server';
import { ADMIN_EMAIL } from '../utils/test-credentials';

const ADMIN_NOTICE_SUBJECT =
  'Nowa rejestracja użytkownika - wymaga zatwierdzenia';
const GOOGLE_BUTTON = /Zaloguj się przez Google/i;

test.describe.configure({ mode: 'serial' });

test('a new Google user lands in the app and admins are notified', async ({
  page,
  request,
}) => {
  const email = `google-new-${Date.now()}@e2e-test.com`;
  await queueGoogleIdentity(request, {
    email,
    name: 'Google New User',
    sub: randomUUID(),
  });
  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

  await page.goto('/login');
  await page.getByRole('button', { name: GOOGLE_BUTTON }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  const notice = await waitForMail(request, ADMIN_EMAIL, {
    subject: ADMIN_NOTICE_SUBJECT,
    contains: email,
  });
  expect(notice.text).toContain('Google New User');
});

test('a returning user signs in to the existing account', async ({
  page,
  request,
}) => {
  const email = `google-existing-${Date.now()}@e2e-test.com`;
  await createCredentialsUser({
    email,
    password: 'ExistingPassword123!',
    name: 'Existing Google User',
  });
  await queueGoogleIdentity(request, {
    email,
    name: 'Existing Google User',
    sub: randomUUID(),
  });
  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

  await page.goto('/login');
  await page.getByRole('button', { name: GOOGLE_BUTTON }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Existing Google User').first()).toBeVisible();
});
