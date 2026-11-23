export type EmailType =
  | 'verification'
  | 'password_reset'
  | 'account_approved'
  | 'account_activation'
  | 'admin_notification'
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
