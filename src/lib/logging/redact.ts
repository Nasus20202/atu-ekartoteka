const EMAIL_PATTERN = /[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export const REDACTED_EMAIL = '[redacted-email]';
export const REDACTED_VALUE = '[redacted]';

export function redactEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, REDACTED_EMAIL);
}
