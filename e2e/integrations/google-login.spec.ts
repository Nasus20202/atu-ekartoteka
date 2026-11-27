/**
 * Google sign-in runs through the local OpenID provider mock.
 */

import { randomUUID } from 'crypto';

import { expect, test } from '../fixtures';
import { createCredentialsUser } from '../utils/create-credentials-user';
import { expectDeliveredEmail } from '../utils/email-assertions';
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

// The mock keeps one queued identity, so every spec that signs in with Google
// lives in this file and runs serially
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
  expectDeliveredEmail(notice, {
    to: ADMIN_EMAIL,
    subject: ADMIN_NOTICE_SUBJECT,
    both: [email, 'Google New User'],
    linkPath: '/admin/users',
  });
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

test('with no identity queued, the mock sign-in form signs the user in', async ({
  page,
}) => {
  const email = `google-form-${Date.now()}@e2e-test.com`;
  await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);

  await page.goto('/login');
  await page.getByRole('button', { name: GOOGLE_BUTTON }).click();
  await expect(
    page.getByRole('heading', { name: 'Mock Google sign-in' })
  ).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Name (optional)').fill('Google Form User');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
});
