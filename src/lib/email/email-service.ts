import nodemailer, { type Transporter } from 'nodemailer';

import { readEmailConfig } from '@/lib/email/email-config';
import {
  accountActivationMessage,
  accountApprovedMessage,
  newUserAdminMessage,
  passwordResetMessage,
  verificationMessage,
} from '@/lib/email/email-messages';
import type {
  EmailOptions,
  EmailServiceConfig,
  EmailType,
} from '@/lib/email/email-types';
import { hashToken } from '@/lib/email/verification-utils';
import { createLogger } from '@/lib/logger';
import { emailMetrics } from '@/lib/opentelemetry/email-metrics';

const logger = createLogger('email-service');
const isDev = process.env.NODE_ENV === 'development';

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
        { type: emailType, ...(isDev && { text: options.text }) },
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
        { type: emailType, result: 'success', messageId: info.messageId },
        'Email sent'
      );

      emailMetrics.recordEmailSent(emailType, 'success');
      return true;
    } catch (error) {
      logger.error(
        { error, type: emailType, result: 'failure' },
        'Email failed'
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

  async sendVerificationEmail(
    to: string,
    token: string,
    name?: string
  ): Promise<boolean> {
    logger.info(
      {
        tokenLength: token.length,
        tokenFingerprint: hashToken(token).slice(0, 12),
        hasName: !!name,
      },
      'Sending verification email'
    );

    const result = await this.sendEmail(
      { to, ...(await verificationMessage(token, name)) },
      'verification'
    );

    return result;
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name?: string
  ): Promise<boolean> {
    return this.sendEmail(
      { to, ...(await passwordResetMessage(resetToken, name)) },
      'password_reset'
    );
  }

  async sendAccountApprovedEmail(to: string, name?: string): Promise<boolean> {
    return this.sendEmail(
      { to, ...(await accountApprovedMessage(name)) },
      'account_approved'
    );
  }

  async sendAccountActivationEmail(
    to: string,
    tempPassword: string,
    name?: string
  ): Promise<boolean> {
    return this.sendEmail(
      { to, ...(await accountActivationMessage(to, tempPassword, name)) },
      'account_activation'
    );
  }

  async sendNewUserNotificationToAdmin(
    adminEmail: string,
    userEmail: string,
    userName: string,
    registrationDate: string
  ): Promise<boolean> {
    return this.sendEmail(
      {
        to: adminEmail,
        ...(await newUserAdminMessage(userEmail, userName, registrationDate)),
      },
      'admin_notification'
    );
  }
}

/**
 * Get configured email service instance
 */
export function getEmailService(): EmailService {
  return new EmailService(readEmailConfig());
}
