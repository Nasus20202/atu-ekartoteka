import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/reset-password/route';

// Mock dependencies
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed-password')),
  },
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    passwordReset: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn((operations) => Promise.all(operations)),
  },
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

const { prisma } = await import('@/lib/database/prisma');

describe('POST /api/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if token or password is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'abc',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token i hasło są wymagane');
  });

  it('should return 400 if password is too short', async () => {
    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'abc',
        password: 'short',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Hasło musi mieć co najmniej 8 znaków');
  });

  it('should return 400 if token is invalid', async () => {
    vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid',
        password: 'newpass123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Nieprawidłowy lub wygasły token');
  });

  it('should return 400 if token is expired', async () => {
    const expiredToken = {
      id: 'reset-123',
      userId: 'user-123',
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 1000), // Expired
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        password: 'old',
        role: 'TENANT' as const,
        status: 'APPROVED' as const,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue(expiredToken);

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'expired-token',
        password: 'newpass123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token wygasł');
  });

  it('should return 400 if token was already used', async () => {
    const usedToken = {
      id: 'reset-123',
      userId: 'user-123',
      token: 'used-token',
      expiresAt: new Date(Date.now() + 3600000), // Valid
      used: true, // Already used
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        password: 'old',
        role: 'TENANT' as const,
        status: 'APPROVED' as const,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue(usedToken);

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'used-token',
        password: 'newpass123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token został już użyty');
  });

  it('should successfully reset password with valid token', async () => {
    const validToken = {
      id: 'reset-123',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        password: 'old-hashed',
        role: 'TENANT' as const,
        status: 'APPROVED' as const,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue(validToken);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { ...validToken.user, password: 'new-hashed' },
      { ...validToken, used: true },
    ]);

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        password: 'newpass123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Hasło zostało zmienione pomyślnie');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should block OAuth users from resetting password via token', async () => {
    const mockOAuthUser = {
      id: 'oauth-user-123',
      email: 'google@example.com',
      name: 'Google User',
      password: null,
      role: 'TENANT' as const,
      status: 'APPROVED' as const,
      emailVerified: true,
      authMethod: 'GOOGLE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResetToken = {
      id: 'reset-123',
      userId: 'oauth-user-123',
      token: 'test-token-123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockOAuthUser,
    };

    vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue(
      mockResetToken as any
    );

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'test-token-123',
        password: 'new-password-123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      'Konto Google nie może resetować hasła. Użyj logowania przez Google.'
    );

    // Ensure no password update was attempted
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.passwordReset.update).not.toHaveBeenCalled();
  });

  it('should allow credentials users to reset password via token', async () => {
    const mockCredentialsUser = {
      id: 'credentials-user-123',
      email: 'credentials@example.com',
      name: 'Credentials User',
      password: 'old-hashed-password',
      role: 'TENANT' as const,
      status: 'APPROVED' as const,
      emailVerified: true,
      authMethod: 'CREDENTIALS' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResetToken = {
      id: 'reset-123',
      userId: 'credentials-user-123',
      token: 'test-token-123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockCredentialsUser,
    };

    vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue(
      mockResetToken as any
    );
    vi.mocked(prisma.$transaction).mockImplementation(() => {
      return Promise.resolve([{}, {}]);
    });

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'test-token-123',
        password: 'new-password-123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Hasło zostało zmienione pomyślnie');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(prisma.passwordReset.findUnique).mockRejectedValue(
      new Error('Database error')
    );

    const req = new NextRequest('http://localhost:3000/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'token',
        password: 'newpass123',
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Nie udało się zresetować hasła');
  });
});
