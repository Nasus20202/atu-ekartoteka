import { expect, test } from '@playwright/test';
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
});
