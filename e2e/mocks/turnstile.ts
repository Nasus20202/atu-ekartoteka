import { TURNSTILE_VALID_TOKEN } from './constants';

export interface SiteverifyResult {
  success: boolean;
  'error-codes'?: string[];
}

export function verifyMockToken(token: string | null): SiteverifyResult {
  if (token === TURNSTILE_VALID_TOKEN) return { success: true };
  return { success: false, 'error-codes': ['invalid-input-response'] };
}
