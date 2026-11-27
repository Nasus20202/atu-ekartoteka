import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoPersonalData } from '@/__tests__/helpers/expect-no-personal-data';
import {
  EmailService,
  getEmailService,
} from '@/lib/platform/email/email-service';
import type { EmailServiceConfig } from '@/lib/platform/email/email-types';

const {
  mockSendMail,
  mockVerify,
  mockLoggerInfo,
  mockLoggerError,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
  mockVerify: vi.fn().mockResolvedValue(true),
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

const { mockPasswordResetMessage } = vi.hoisted(() => ({
  mockPasswordResetMessage: vi.fn(),
}));

vi.mock('@/lib/platform/email/email-messages', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/lib/platform/email/email-messages')
    >();
  mockPasswordResetMessage.mockImplementation(original.passwordResetMessage);
  return { ...original, passwordResetMessage: mockPasswordResetMessage };
});

const mockTransport = {
  sendMail: mockSendMail,
  verify: mockVerify,
};

// Mock dependencies
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransport),
  },
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: mockLoggerWarn,
  })),
}));

vi.mock('@/lib/platform/opentelemetry/email-metrics', () => ({
  emailMetrics: {
    recordEmailSent: vi.fn(),
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockConfig: EmailServiceConfig;
  const originalSmtpHost = process.env.SMTP_HOST;

  beforeEach(() => {
    mockSendMail.mockClear();
    mockVerify.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
    mockLoggerWarn.mockClear();
    mockSendMail.mockResolvedValue({ messageId: 'test-123' });

    mockConfig = {
      from: 'test@example.com',
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    };
  });

  afterEach(() => {
    // Restore original SMTP_HOST
    if (originalSmtpHost) {
      process.env.SMTP_HOST = originalSmtpHost;
    } else {
      delete process.env.SMTP_HOST;
    }
  });

  describe('sender name configuration', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
    });

    it('should use email address only when fromName is not provided', async () => {
      emailService = new EmailService(mockConfig);

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@example.com',
        })
      );
    });

    it('should format sender with name when fromName is provided', async () => {
      const configWithName = {
        ...mockConfig,
        fromName: 'ATU Ekartoteka',
      };
      emailService = new EmailService(configWithName);

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"ATU Ekartoteka" <test@example.com>',
        })
      );
    });

    it('should handle special characters in fromName', async () => {
      const configWithName = {
        ...mockConfig,
        fromName: 'ATU "Ekartoteka" System',
      };
      emailService = new EmailService(configWithName);

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"ATU "Ekartoteka" System" <test@example.com>',
        })
      );
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should send email successfully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result).toEqual({ ok: true, delivery: 'sent' });
    });

    it('logs the e-mail type and result, never the recipient', async () => {
      await emailService.sendEmail(
        { to: 'canary@example.com', subject: 'Canary', html: '<p>x</p>' },
        'verification'
      );
      mockSendMail.mockRejectedValueOnce(new Error('Invalid recipient'));
      await emailService.sendEmail(
        { to: 'canary@example.com', subject: 'Canary', html: '<p>x</p>' },
        'verification'
      );

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'verification', result: 'success' }),
        'Email sent'
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'verification', result: 'failure' }),
        'Email failed'
      );
      const calls = [mockLoggerInfo, mockLoggerError];
      expectNoPersonalData(calls, ['canary@example.com', 'Canary']);
    });

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toEqual({ ok: false, reason: 'send-failed' });
    });
  });

  describe('SMTP not configured', () => {
    beforeEach(() => {
      delete process.env.SMTP_HOST;
      emailService = new EmailService(mockConfig);
    });

    it('should skip sending email when SMTP_HOST is not configured', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result).toEqual({ ok: true, delivery: 'skipped' });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not log text body when not in development', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Plain text body',
      });

      expect(mockLoggerInfo).not.toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.anything() }),
        expect.any(String)
      );
    });

    it('should skip connection verification when SMTP_HOST is not configured', async () => {
      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).not.toHaveBeenCalled();
    });
  });

  describe('SMTP not configured (development)', () => {
    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'development');
      delete process.env.SMTP_HOST;
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should log text body when SMTP is not configured', async () => {
      const { EmailService: FreshEmailService } =
        await import('@/lib/platform/email/email-service');
      const freshService = new FreshEmailService(mockConfig);

      await freshService.sendEmail({
        to: 'dev@example.com',
        subject: 'Dev Subject',
        html: '<p>Dev</p>',
        text: 'Plain text body',
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Plain text body' }),
        expect.any(String)
      );
    });
  });

  describe('verifyConnection', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should verify connection successfully', async () => {
      mockVerify.mockResolvedValueOnce(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should handle verification errors', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('sendVerificationEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should send verification email with token', async () => {
      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'test-token-123'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Potwierdź swój adres email',
        })
      );
    });

    it('should send verification email with name', async () => {
      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'test-token-123',
        'John'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should return a failed result when sending fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Send failed'));

      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'test-token-123'
      );

      expect(result).toEqual({ ok: false, reason: 'send-failed' });
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('returns a failed result instead of throwing when the message cannot be built', async () => {
      mockPasswordResetMessage.mockRejectedValueOnce(new Error('render'));

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-456'
      );

      expect(result).toEqual({ ok: false, reason: 'send-failed' });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should send password reset email', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-456'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Resetowanie hasła',
        })
      );
    });

    it('should send password reset email with name', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-456',
        'Jane'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('sendAccountApprovedEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should send account approved email', async () => {
      const result =
        await emailService.sendAccountApprovedEmail('user@example.com');

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Twoje konto zostało zatwierdzone',
        })
      );
    });

    it('should send account approved email with name', async () => {
      const result = await emailService.sendAccountApprovedEmail(
        'user@example.com',
        'Bob'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('voting emails', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('sends the vote confirmation link', async () => {
      const result = await emailService.sendVoteConfirmationEmail(
        'user@example.com',
        'tok-1',
        'Remont',
        15,
        'Anna'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Potwierdź swój głos',
          text: expect.stringContaining('/dashboard/votings/confirm/tok-1'),
        })
      );
    });

    it('sends the voting notification', async () => {
      const result = await emailService.sendVotingNotificationEmail(
        'user@example.com',
        'v1',
        'Remont',
        'Wspólnota',
        '1 grudnia 2026 12:00'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Nowe głosowanie w Twojej wspólnocie',
          text: expect.stringContaining('/dashboard/votings/v1'),
        })
      );
    });

    it('reports a failed delivery instead of throwing', async () => {
      mockSendMail.mockRejectedValue(new Error('smtp down'));

      expect(
        await emailService.sendVoteConfirmationEmail(
          'user@example.com',
          'tok-1',
          'Remont',
          15
        )
      ).toEqual({ ok: false, reason: 'send-failed' });
    });
  });

  describe('sendAccountActivationEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should send account activation email with temp password', async () => {
      const result = await emailService.sendAccountActivationEmail(
        'user@example.com',
        'TempPass123!'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Twoje konto zostało utworzone – ustaw nowe hasło',
        })
      );
    });

    it('should send account activation email with name', async () => {
      const result = await emailService.sendAccountActivationEmail(
        'user@example.com',
        'TempPass123!',
        'Anna'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should return a failed result when sending fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Send failed'));

      const result = await emailService.sendAccountActivationEmail(
        'user@example.com',
        'TempPass123!'
      );

      expect(result).toEqual({ ok: false, reason: 'send-failed' });
    });
  });

  describe('sendNewUserNotificationToAdmin', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should send new user notification to admin', async () => {
      const result = await emailService.sendNewUserNotificationToAdmin(
        'admin@example.com',
        'newuser@example.com',
        'New User',
        '2024-01-15'
      );

      expect(result).toEqual({ ok: true, delivery: 'sent' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: 'Nowa rejestracja użytkownika - wymaga zatwierdzenia',
        })
      );
    });
  });
});

describe('getEmailService', () => {
  it('should return EmailService instance with default config', () => {
    const service = getEmailService();

    expect(service).toBeInstanceOf(EmailService);
  });
});
