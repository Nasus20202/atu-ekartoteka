import { describe, expect, it } from 'vitest';

import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
  UNKNOWN_ERROR_MESSAGE,
} from '@/lib/utils/error-message';

describe('getErrorMessage', () => {
  it('returns the message of an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('falls back to the unknown error message for non-errors', () => {
    expect(getErrorMessage('boom')).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it('uses the given fallback', () => {
    expect(getErrorMessage(null, GENERIC_ERROR_MESSAGE)).toBe(
      GENERIC_ERROR_MESSAGE
    );
  });
});
