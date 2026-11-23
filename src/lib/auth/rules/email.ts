/**
 * Canonical form of an account email. Registration, login and password reset
 * must agree on this form, otherwise the same person can end up with two
 * accounts or no working reset flow.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
