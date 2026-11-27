export type EmailType =
  | 'verification'
  | 'password_reset'
  | 'account_approved'
  | 'account_activation'
  | 'admin_notification'
  | 'vote_confirmation'
  | 'voting_notification'
  | 'other';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailServiceConfig {
  from: string;
  fromName?: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Outcome of sending one email. The service never throws: a failure is a value,
 * so a caller cannot mistake it for success. `skipped` means SMTP is not
 * configured and nothing was sent, which is not an error in development.
 */
export type EmailSendResult =
  | { ok: true; delivery: 'sent' | 'skipped' }
  | { ok: false; reason: 'send-failed' };
