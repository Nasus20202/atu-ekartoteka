import { describe, expect, it } from 'vitest';

import { redactEmails } from '@/lib/logging/redact';

describe('redactEmails', () => {
  it('replaces every address in the text', () => {
    expect(
      redactEmails('to a.b+c@example.com, cc "o\'neil@mail.example.org"')
    ).toBe('to [redacted-email], cc "[redacted-email]"');
  });

  it('leaves text without an address untouched', () => {
    expect(redactEmails('connection refused')).toBe('connection refused');
  });
});
