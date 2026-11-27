import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

import { MOCK_URL, waitForMail } from '../utils/mock-server';

const SMTP_PORT = Number(process.env.MOCK_SMTP_PORT ?? 1025);
const INBOX_URL = `${MOCK_URL}/inbox`;
const CONFIRM_LINK = 'https://example.com/confirm?token=mock-inbox';

test.describe('Mock inbox', () => {
  test('shows a captured mail in the HTML and Text views', async ({
    page,
    request,
  }) => {
    // Clear all is not used here: other specs share the mailbox
    const id = randomUUID();
    const recipient = `mock-inbox-${id}@example.com`;
    const subject = `Inbox check ${id}`;
    const transport = nodemailer.createTransport({
      host: 'localhost',
      port: SMTP_PORT,
      secure: false,
      ignoreTLS: true,
    });
    await transport.sendMail({
      from: 'noreply@example.com',
      to: recipient,
      subject,
      text: `Open ${CONFIRM_LINK} to continue`,
      html: `<p>html body</p><a href="${CONFIRM_LINK}">confirm</a>`,
    });
    await waitForMail(request, recipient, { subject });

    await page.goto(INBOX_URL);
    await page
      .getByRole('searchbox', { name: 'Filter messages' })
      .fill(recipient);
    await page.getByRole('button', { name: subject }).click();

    await expect(page.locator('#subject')).toHaveText(subject);
    await expect(
      page
        .frameLocator('iframe[title="HTML body"]')
        .getByText('html body', { exact: true })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await expect(page.locator('#html-view')).toBeHidden();
    await expect(
      page.getByRole('link', { name: CONFIRM_LINK })
    ).toHaveAttribute('href', CONFIRM_LINK);
  });
});
