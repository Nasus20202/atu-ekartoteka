import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailService,
  type EmailServiceConfig,
  getEmailService,
} from '@/lib/email/email-service';

// Create mock transport
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-123' });
const mockVerify = vi.fn().mockResolvedValue(true);
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

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock('@/lib/email/template-loader', () => ({
  renderEmailTemplate: vi.fn(() => '<html>Test</html>'),
}));

vi.mock('@/lib/opentelemetry/email-metrics', () => ({
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

      expect(result).toBe(true);
    });

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
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

      expect(result).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should skip connection verification when SMTP_HOST is not configured', async () => {
      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).not.toHaveBeenCalled();
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

      expect(result).toBe(true);
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

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should return false when sending fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Send failed'));

      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'test-token-123'
      );

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      emailService = new EmailService(mockConfig);
    });

    it('should send password reset email', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-456'
      );

      expect(result).toBe(true);
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

      expect(result).toBe(true);
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

      expect(result).toBe(true);
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

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
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

      expect(result).toBe(true);
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
