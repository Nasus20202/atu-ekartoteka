/**
 * Google sign-in runs through the local OpenID provider mock.
 */

import { createPublicKey, createVerify, randomUUID } from 'crypto';

import { expect, test } from '../fixtures';
import { createCredentialsUser } from '../utils/create-credentials-user';
import {
  MOCK_URL,
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

test('the mock issues a signed Google id_token', async ({ request }) => {
  const issuer = `${MOCK_URL}/google`;
  const discovery = await (
    await request.get(`${issuer}/.well-known/openid-configuration`)
  ).json();
  expect(discovery.issuer).toBe(issuer);

  await request.post(`${issuer}/identity`, {
    data: { email: 'g@example.com', name: 'G User', sub: 'sub-1' },
  });
  const redirect = await request.get(`${issuer}/authorize`, {
    params: { redirect_uri: 'http://localhost/cb', state: 's1' },
    maxRedirects: 0,
  });
  const target = new URL(redirect.headers().location);
  expect(target.searchParams.get('state')).toBe('s1');

  const tokens = await (
    await request.post(`${issuer}/token`, {
      form: { code: target.searchParams.get('code') ?? '' },
    })
  ).json();
  const [header, payload, signature] = tokens.id_token.split('.');
  const jwks = await (await request.get(`${issuer}/jwks`)).json();
  const verified = createVerify('RSA-SHA256')
    .update(`${header}.${payload}`)
    .verify(
      createPublicKey({ key: jwks.keys[0], format: 'jwk' }),
      Buffer.from(signature, 'base64url')
    );

  expect(verified).toBe(true);
  expect(
    JSON.parse(Buffer.from(payload, 'base64url').toString())
  ).toMatchObject({
    iss: issuer,
    email: 'g@example.com',
    sub: 'sub-1',
  });
});
