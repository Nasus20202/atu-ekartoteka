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
  renderEmailTemplate: vi.fn((name, format) => {
    if (name === 'new-user-registration-admin') {
      return format === 'html'
        ? '<html>New user notification</html>'
        : 'New user notification';
    }
    return '<html>Test</html>';
  }),
}));

describe('EmailService - New User Notification', () => {
  let emailService: EmailService;
  let mockConfig: EmailServiceConfig;

  beforeEach(() => {
    mockSendMail.mockClear();
    mockVerify.mockClear();
    mockSendMail.mockResolvedValue({ messageId: 'test-123' });

    mockConfig = {
      from: 'test@example.com',
      fromName: 'Test System',
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    };
    emailService = new EmailService(mockConfig);
  });

  describe('sendNewUserNotificationToAdmin', () => {
    it('should send notification to admin with correct data', async () => {
      const result = await emailService.sendNewUserNotificationToAdmin(
        'admin@example.com',
        'newuser@example.com',
        'John Doe',
        '2024-01-15 10:30'
      );

      expect(result).toBe(true);
    });

    it('should include all user details in notification', async () => {
      await emailService.sendNewUserNotificationToAdmin(
        'admin@example.com',
        'newuser@example.com',
        'Jane Smith',
        '2024-01-15 14:45'
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: 'Nowa rejestracja użytkownika - wymaga zatwierdzenia',
        })
      );
    });

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailService.sendNewUserNotificationToAdmin(
        'admin@example.com',
        'newuser@example.com',
        'Test User',
        '2024-01-15 10:00'
      );

      expect(result).toBe(false);
    });

    it('should use correct admin URL', async () => {
      const originalEnv = process.env.APP_URL;
      process.env.APP_URL = 'https://example.com';

      await emailService.sendNewUserNotificationToAdmin(
        'admin@example.com',
        'newuser@example.com',
        'Test User',
        '2024-01-15 10:00'
      );

      const { renderEmailTemplate } = await import(
        '@/lib/email/template-loader'
      );
      expect(renderEmailTemplate).toHaveBeenCalledWith(
        'new-user-registration-admin',
        'html',
        expect.objectContaining({
          ADMIN_URL: 'https://example.com/admin/users',
        })
      );

      process.env.APP_URL = originalEnv;
    });
  });
});
