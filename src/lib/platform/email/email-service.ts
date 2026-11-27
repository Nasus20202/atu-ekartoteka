import nodemailer, { type Transporter } from 'nodemailer';

import { hashToken } from '@/lib/auth/rules/verification-tokens';
import { readEmailConfig } from '@/lib/platform/email/email-config';
import {
  accountActivationMessage,
  accountApprovedMessage,
  newUserAdminMessage,
  passwordResetMessage,
  verificationMessage,
  voteConfirmationMessage,
  votingNotificationMessage,
} from '@/lib/platform/email/email-messages';
import type {
  EmailOptions,
  EmailSendResult,
  EmailServiceConfig,
  EmailType,
} from '@/lib/platform/email/email-types';
import { createLogger } from '@/lib/platform/logging/logger';
import { emailMetrics } from '@/lib/platform/opentelemetry/email-metrics';

const logger = createLogger('email-service');
const isDev = process.env.NODE_ENV === 'development';

const SENT: EmailSendResult = { ok: true, delivery: 'sent' };
const SKIPPED: EmailSendResult = { ok: true, delivery: 'skipped' };
const FAILED: EmailSendResult = { ok: false, reason: 'send-failed' };

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
  ): Promise<EmailSendResult> {
    if (!this.isConfigured) {
      logger.info(
        { type: emailType, ...(isDev && { text: options.text }) },
        'Email skipped (SMTP not configured)'
      );
      emailMetrics.recordEmailSent(emailType, 'skipped');
      return SKIPPED;
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
      return SENT;
    } catch (error) {
      logger.error(
        { error, type: emailType, result: 'failure' },
        'Email failed'
      );

      emailMetrics.recordEmailSent(emailType, 'failure');
      return FAILED;
    }
  }

  /** Builds the message and sends it; a message that cannot be built is a failed send. */
  private async deliver(
    emailType: EmailType,
    to: string,
    buildMessage: () => Promise<Omit<EmailOptions, 'to'>>
  ): Promise<EmailSendResult> {
    let message: Omit<EmailOptions, 'to'>;
    try {
      message = await buildMessage();
    } catch (error) {
      logger.error(
        { error, type: emailType, result: 'failure' },
        'Email message could not be built'
      );
      emailMetrics.recordEmailSent(emailType, 'failure');
      return FAILED;
    }

    return this.sendEmail({ to, ...message }, emailType);
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
  ): Promise<EmailSendResult> {
    logger.info(
      {
        tokenLength: token.length,
        tokenFingerprint: hashToken(token).slice(0, 12),
        hasName: !!name,
      },
      'Sending verification email'
    );

    return this.deliver('verification', to, () =>
      verificationMessage(token, name)
    );
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.deliver('password_reset', to, () =>
      passwordResetMessage(resetToken, name)
    );
  }

  async sendAccountApprovedEmail(
    to: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.deliver('account_approved', to, () =>
      accountApprovedMessage(name)
    );
  }

  async sendAccountActivationEmail(
    to: string,
    tempPassword: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.deliver('account_activation', to, () =>
      accountActivationMessage(to, tempPassword, name)
    );
  }

  async sendNewUserNotificationToAdmin(
    adminEmail: string,
    userEmail: string,
    userName: string,
    registrationDate: string
  ): Promise<EmailSendResult> {
    return this.deliver('admin_notification', adminEmail, () =>
      newUserAdminMessage(userEmail, userName, registrationDate)
    );
  }

  async sendVoteConfirmationEmail(
    to: string,
    token: string,
    votingTitle: string,
    validForMinutes: number,
    name?: string
  ): Promise<EmailSendResult> {
    return this.deliver('vote_confirmation', to, () =>
      voteConfirmationMessage(token, votingTitle, validForMinutes, name)
    );
  }

  async sendVotingNotificationEmail(
    to: string,
    votingId: string,
    votingTitle: string,
    hoaName: string,
    endsAt?: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.deliver('voting_notification', to, () =>
      votingNotificationMessage(votingId, votingTitle, hoaName, endsAt, name)
    );
  }
}

/**
 * Get configured email service instance
 */
export function getEmailService(): EmailService {
  return new EmailService(readEmailConfig());
}
