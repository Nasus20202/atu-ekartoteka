import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailService,
  type EmailServiceConfig,
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
  })),
}));

vi.mock('@/lib/email/template-loader', () => ({
  renderEmailTemplate: vi.fn(() => '<html>Test</html>'),
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockConfig: EmailServiceConfig;

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

  describe('sender name configuration', () => {
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
});
