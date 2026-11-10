import { PLACEHOLDER_PATTERN } from '@/lib/privacy/placeholders';
import { PRIVACY_POLICY_MAX_LENGTH } from '@/lib/settings/constants';
import type { ParseResult } from '@/lib/settings/parse-result';

export const UNRESOLVED_PLACEHOLDERS_MESSAGE =
  'Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami kwadratowymi [[…]]';
export const POLICY_TOO_LONG_MESSAGE = `Polityka może mieć najwyżej ${PRIVACY_POLICY_MAX_LENGTH} znaków`;

/** Trims the text; an empty text means "no policy" and is stored as null. */
export function parsePrivacyPolicy(value: unknown): ParseResult<string | null> {
  if (typeof value !== 'string') return { ok: false };

  const text = value.trim();
  if (text === '') return { ok: true, value: null };
  if (text.length > PRIVACY_POLICY_MAX_LENGTH) {
    return { ok: false, message: POLICY_TOO_LONG_MESSAGE };
  }
  if (PLACEHOLDER_PATTERN.test(text)) {
    return { ok: false, message: UNRESOLVED_PLACEHOLDERS_MESSAGE };
  }

  return { ok: true, value: text };
}
