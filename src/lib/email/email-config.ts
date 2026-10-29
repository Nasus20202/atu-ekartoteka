import type { EmailServiceConfig } from '@/lib/email/email-types';

const DEFAULT_FROM = 'noreply@example.com';
const DEFAULT_SMTP_HOST = 'localhost';
const DEFAULT_SMTP_PORT = '465';

export function readEmailConfig(): EmailServiceConfig {
  return {
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    fromName: process.env.EMAIL_FROM_NAME,
    host: process.env.SMTP_HOST || DEFAULT_SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || DEFAULT_SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE?.toLowerCase() === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };
}
