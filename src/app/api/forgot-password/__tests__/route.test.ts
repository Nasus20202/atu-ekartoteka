import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/forgot-password/route';
import { AuthMethod } from '@/lib/types';

// Create mock functions using vi.hoisted to ensure they're available when vi.mock runs
const {
  mockUserFindUnique,
  mockPasswordResetDeleteMany,
  mockPasswordResetCreate,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockPasswordResetDeleteMany: vi.fn(),
  mockPasswordResetCreate: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
    },
    passwordReset: {
      deleteMany: mockPasswordResetDeleteMany,
      create: mockPasswordResetCreate,
    },
  },
}));

vi.mock('@/lib/email/email-service', () => ({
  getEmailService: vi.fn(() => ({
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/email/verification-utils', () => ({
  generateSecureToken: vi.fn(() => 'test-token-123'),
  hashToken: vi.fn((token: string) => `hashed-${token}`),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock turnstile verification as always valid for tests
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: vi.fn(() => Promise.resolve(true)),
}));

describe('POST /api/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ turnstileToken: 'test-turnstile-token' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email jest wymagany');
  });

  it('should return success message even if user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(
      'Jeśli konto istnieje, email z instrukcjami został wysłany'
    );
  });

  it('should return 400 if turnstile token is invalid', async () => {
    // Make turnstile validation fail
    const { verifyTurnstileToken } = await import('@/lib/turnstile');
    vi.mocked(verifyTurnstileToken).mockResolvedValueOnce(false);

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        turnstileToken: 'invalid-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Nieprawidłowe potwierdzenie turnstile');
  });

  it('should create password reset token and send email for existing user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed',
      role: 'TENANT' as const,
      status: 'APPROVED' as const,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(mockUser);
    mockPasswordResetDeleteMany.mockResolvedValue({ count: 0 });
    mockPasswordResetCreate.mockResolvedValue({
      id: 'reset-123',
      userId: mockUser.id,
      token: 'test-token-123',
      expiresAt: new Date(),
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(
      'Jeśli konto istnieje, email z instrukcjami został wysłany'
    );
    expect(mockPasswordResetDeleteMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    });
    expect(mockPasswordResetCreate).toHaveBeenCalled();
  });

  it('should block OAuth users from password reset', async () => {
    const mockOAuthUser = {
      id: 'oauth-user-123',
      email: 'google@example.com',
      name: 'Google User',
      password: null,
      role: 'TENANT' as const,
      status: 'APPROVED' as const,
      emailVerified: true,
      authMethod: AuthMethod.GOOGLE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(mockOAuthUser);

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'google@example.com',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(
      'Konto Google nie może resetować hasła. Użyj logowania przez Google.'
    );

    // Ensure no password reset token was created
    expect(mockPasswordResetDeleteMany).not.toHaveBeenCalled();
    expect(mockPasswordResetCreate).not.toHaveBeenCalled();
  });

  it('should allow credentials users to reset password', async () => {
    const mockCredentialsUser = {
      id: 'credentials-user-123',
      email: 'credentials@example.com',
      name: 'Credentials User',
      password: 'hashed-password',
      role: 'TENANT' as const,
      status: 'APPROVED' as const,
      emailVerified: true,
      authMethod: AuthMethod.CREDENTIALS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(mockCredentialsUser);
    mockPasswordResetDeleteMany.mockResolvedValue({ count: 0 });
    mockPasswordResetCreate.mockResolvedValue({
      id: 'reset-123',
      userId: mockCredentialsUser.id,
      token: 'test-token-123',
      expiresAt: new Date(),
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'credentials@example.com',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(
      'Jeśli konto istnieje, email z instrukcjami został wysłany'
    );
    expect(mockPasswordResetDeleteMany).toHaveBeenCalledWith({
      where: { userId: mockCredentialsUser.id },
    });
    expect(mockPasswordResetCreate).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Nie udało się przetworzyć żądania');
  });
});
