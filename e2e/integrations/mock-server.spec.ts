import { expect, test } from '@playwright/test';
import { createPublicKey, createVerify } from 'crypto';
import nodemailer from 'nodemailer';

import {
  MOCK_URL,
  TURNSTILE_INVALID_TOKEN,
  TURNSTILE_VALID_TOKEN,
  waitForMail,
} from '../utils/mock-server';

const SMTP_PORT = Number(process.env.MOCK_SMTP_PORT ?? 1025);
const RECIPIENT = 'mock-server-check@example.com';

test.describe('Mock server', () => {
  test('captures SMTP mail and serves it by recipient', async ({ request }) => {
    const transport = nodemailer.createTransport({
      host: 'localhost',
      port: SMTP_PORT,
      secure: false,
      ignoreTLS: true,
    });
    await transport.sendMail({
      from: 'noreply@example.com',
      to: RECIPIENT,
      subject: 'Hello',
      text: 'plain body',
      html: '<p>html body</p>',
    });

    const mail = await waitForMail(request, RECIPIENT, { subject: 'Hello' });
    expect(mail.text).toContain('plain body');
    expect(mail.html).toContain('html body');

    await request.delete(`${MOCK_URL}/mail`, { params: { to: RECIPIENT } });
    const left = await request.get(`${MOCK_URL}/mail`, {
      params: { to: RECIPIENT },
    });
    expect(await left.json()).toEqual([]);
  });

  test('verifies Turnstile tokens', async ({ request }) => {
    const verify = async (token: string) => {
      const response = await request.post(`${MOCK_URL}/turnstile/siteverify`, {
        form: { secret: 'secret', response: token },
      });
      return (await response.json()) as { success: boolean };
    };

    expect((await verify(TURNSTILE_VALID_TOKEN)).success).toBe(true);
    expect((await verify(TURNSTILE_INVALID_TOKEN)).success).toBe(false);
  });

  test('issues a signed Google id_token', async ({ request }) => {
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
});
