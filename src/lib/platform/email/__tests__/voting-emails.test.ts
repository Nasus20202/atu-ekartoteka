import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  voteConfirmationMessage,
  votingNotificationMessage,
} from '@/lib/platform/email/email-messages';

const APP_URL = 'https://ekartoteka.example.com';

describe('voting emails', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', APP_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('links the confirmation to the token page and states its lifetime', async () => {
    const { subject, html, text } = await voteConfirmationMessage(
      'tok-1',
      'Remont dachu',
      15,
      'Anna'
    );

    expect(subject).toBe('Potwierdź swój głos');
    for (const body of [html, text]) {
      expect(body).toContain(`${APP_URL}/dashboard/votings/confirm/tok-1`);
      expect(body).toContain('Remont dachu');
      expect(body).toContain('15 minut');
    }
    expect(html).toContain('Potwierdź głos');
  });

  it('links the notification to the voting and shows the deadline', async () => {
    const { subject, html, text } = await votingNotificationMessage(
      'v1',
      'Remont dachu',
      'Wspólnota Lipowa',
      '1 grudnia 2026 12:00',
      'Anna'
    );

    expect(subject).toBe('Nowe głosowanie w Twojej wspólnocie');
    expect(html).toContain(`${APP_URL}/dashboard/votings/v1`);
    expect(text).toContain(`${APP_URL}/dashboard/votings/v1`);
    expect(text).toContain('Wspólnota Lipowa');
    expect(text).toContain('1 grudnia 2026 12:00');
  });

  it('omits the deadline line when there is none', async () => {
    const { text } = await votingNotificationMessage(
      'v1',
      'Remont dachu',
      'Wspólnota Lipowa'
    );

    expect(text).not.toContain('Termin');
  });
});
