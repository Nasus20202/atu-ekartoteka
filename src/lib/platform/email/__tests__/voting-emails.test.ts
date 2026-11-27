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

  it('puts the code, the voting and its lifetime in the confirmation', async () => {
    const { subject, html, text } = await voteConfirmationMessage(
      '042917',
      'Remont dachu',
      15,
      'Anna'
    );

    expect(subject).toBe('Kod potwierdzający głosowanie');
    for (const body of [html, text]) {
      expect(body).toContain('042917');
      expect(body).toContain('Remont dachu');
      expect(body).toContain('15 minut');
    }
    expect(text).toContain('Kod potwierdzający');
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
