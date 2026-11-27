import { TURNSTILE_DUMMY_TOKEN, TURNSTILE_VALID_TOKEN } from './constants';

export interface SiteverifyResult {
  success: boolean;
  'error-codes'?: string[];
}

const ACCEPTED_TOKENS = new Set([TURNSTILE_VALID_TOKEN, TURNSTILE_DUMMY_TOKEN]);

export function verifyMockToken(token: string | null): SiteverifyResult {
  if (token !== null && ACCEPTED_TOKENS.has(token)) return { success: true };
  return { success: false, 'error-codes': ['invalid-input-response'] };
}
