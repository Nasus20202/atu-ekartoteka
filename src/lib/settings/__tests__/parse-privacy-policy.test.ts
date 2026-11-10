import { describe, expect, it } from 'vitest';

import { PRIVACY_POLICY_MAX_LENGTH } from '@/lib/settings/constants';
import {
  parsePrivacyPolicy,
  POLICY_TOO_LONG_MESSAGE,
  UNRESOLVED_PLACEHOLDERS_MESSAGE,
} from '@/lib/settings/parse-privacy-policy';

describe('parsePrivacyPolicy', () => {
  it('trims the text', () => {
    expect(parsePrivacyPolicy('  # Polityka\n\nTekst.\n ')).toEqual({
      ok: true,
      value: '# Polityka\n\nTekst.',
    });
  });

  it.each(['', '   ', '\n\t'])('maps %j to null (unpublished)', (value) => {
    expect(parsePrivacyPolicy(value)).toEqual({ ok: true, value: null });
  });

  it('accepts text of exactly the maximum length', () => {
    const text = 'a'.repeat(PRIVACY_POLICY_MAX_LENGTH);

    expect(parsePrivacyPolicy(text)).toEqual({ ok: true, value: text });
  });

  it('rejects text over the limit with a message', () => {
    expect(
      parsePrivacyPolicy('a'.repeat(PRIVACY_POLICY_MAX_LENGTH + 1))
    ).toEqual({ ok: false, message: POLICY_TOO_LONG_MESSAGE });
  });

  it('rejects text with an unresolved placeholder', () => {
    expect(parsePrivacyPolicy('Administrator: [[nazwa]]')).toEqual({
      ok: false,
      message: UNRESOLVED_PLACEHOLDERS_MESSAGE,
    });
  });

  it('accepts single square brackets and links', () => {
    expect(parsePrivacyPolicy('[link](https://x.pl) [a]')).toMatchObject({
      ok: true,
    });
  });

  it.each([5, null, undefined, {}, []])(
    'rejects %j that is not text',
    (value) => {
      expect(parsePrivacyPolicy(value)).toEqual({ ok: false });
    }
  );
});
