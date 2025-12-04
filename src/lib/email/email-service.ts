import nodemailer, { type Transporter } from 'nodemailer';

import { renderEmailTemplate } from '@/lib/email/template-loader';
import { createLogger } from '@/lib/logger';
import { emailMetrics } from '@/lib/opentelemetry/email-metrics';

const logger = createLogger('email-service');

export type EmailType =
  | 'verification'
  | 'password_reset'
  | 'account_approved'
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

/**
 * Email service for sending emails via SMTP
 * Supports TLS/SSL encryption for secure email transmission
 * Compatible with AWS SES SMTP, Gmail, SendGrid, and other SMTP providers
 */
export class EmailService {
  private config: EmailServiceConfig;
  private transporter: Transporter | null;
  private isConfigured: boolean;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.isConfigured = !!process.env.SMTP_HOST;

    if (!this.isConfigured) {
      logger.warn('SMTP_HOST not configured - emails will be skipped');
      this.transporter = null;
      return;
    }

    // Create reusable transporter with TLS/SSL
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      // Additional security options
      tls: {
        // Do not fail on invalid certs (for development)
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  /**
   * Send an email using SMTP
   * Supports TLS encryption based on configuration
   */
  async sendEmail(
    options: EmailOptions,
    emailType: EmailType = 'other'
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info(
        {
          to: options.to,
          subject: options.subject,
        },
        'Email skipped (SMTP not configured)'
      );
      emailMetrics.recordEmailSent(emailType, 'skipped');
      return true;
    }

    try {
      // Format sender with name if provided
      const from = this.config.fromName
        ? `"${this.config.fromName}" <${this.config.from}>`
        : this.config.from;

      const info = await this.transporter!.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(
        {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        },
        'Email sent successfully'
      );

      emailMetrics.recordEmailSent(emailType, 'success');
      return true;
    } catch (error) {
      logger.error(
        {
          error,
          to: options.to,
          subject: options.subject,
        },
        'Failed to send email'
      );

      emailMetrics.recordEmailSent(emailType, 'failure');
      return false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info('SMTP connection verification skipped (SMTP not configured)');
      return true;
    }

    try {
      await this.transporter!.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error({ error }, 'SMTP connection verification failed');
      return false;
    }
  }

  /**
   * Send verification email with token
   */
  async sendVerificationEmail(
    to: string,
    token: string,
    name?: string
  ): Promise<boolean> {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    logger.info(
      {
        to,
        tokenLength: token.length,
        hasName: !!name,
        url: verificationUrl,
      },
      'Sending verification email'
    );

    const variables = {
      NAME: name ? ` ${name}` : '',
      VERIFICATION_URL: verificationUrl,
    };

    const html = renderEmailTemplate('verification-email', 'html', variables);
    const text = renderEmailTemplate('verification-email', 'txt', variables);

    const result = await this.sendEmail(
      {
        to,
        subject: 'Potwierdź swój adres email',
        html,
        text,
      },
      'verification'
    );

    if (result) {
      logger.info({ to }, 'Verification email sent successfully');
    } else {
      logger.error({ to }, 'Failed to send verification email');
    }

    return result;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name?: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const variables = {
      NAME: name ? ` ${name}` : '',
      RESET_URL: resetUrl,
    };

    const html = renderEmailTemplate('password-reset', 'html', variables);
    const text = renderEmailTemplate('password-reset', 'txt', variables);

    return this.sendEmail(
      {
        to,
        subject: 'Resetowanie hasła',
        html,
        text,
      },
      'password_reset'
    );
  }

  /**
   * Send account approval notification
   */
  async sendAccountApprovedEmail(to: string, name?: string): Promise<boolean> {
    const loginUrl = `${process.env.APP_URL || 'http://localhost:3000'}/login`;

    const variables = {
      NAME: name ? ` ${name}` : '',
      LOGIN_URL: loginUrl,
    };

    const html = renderEmailTemplate('account-approved', 'html', variables);
    const text = renderEmailTemplate('account-approved', 'txt', variables);

    return this.sendEmail(
      {
        to,
        subject: 'Twoje konto zostało zatwierdzone',
        html,
        text,
      },
      'account_approved'
    );
  }

  /**
   * Send new user registration notification to admin
   */
  async sendNewUserNotificationToAdmin(
    adminEmail: string,
    userEmail: string,
    userName: string,
    registrationDate: string
  ): Promise<boolean> {
    const adminUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/users`;

    const variables = {
      USER_NAME: userName,
      USER_EMAIL: userEmail,
      REGISTRATION_DATE: registrationDate,
      ADMIN_URL: adminUrl,
    };

    const html = renderEmailTemplate(
      'new-user-registration-admin',
      'html',
      variables
    );
    const text = renderEmailTemplate(
      'new-user-registration-admin',
      'txt',
      variables
    );

    return this.sendEmail(
      {
        to: adminEmail,
        subject: 'Nowa rejestracja użytkownika - wymaga zatwierdzenia',
        html,
        text,
      },
      'admin_notification'
    );
  }
}

/**
 * Get configured email service instance
 */
export function getEmailService(): EmailService {
  const config: EmailServiceConfig = {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    fromName: process.env.EMAIL_FROM_NAME,
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE?.toLowerCase() === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  return new EmailService(config);
}
