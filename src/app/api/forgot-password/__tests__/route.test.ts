import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/forgot-password/route';

// Mock dependencies
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordReset: {
      deleteMany: vi.fn(),
      create: vi.fn(),
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
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const { prisma } = await import('@/lib/database/prisma');

describe('POST /api/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email jest wymagany');
  });

  it('should return success message even if user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(
      'Jeśli konto istnieje, email z instrukcjami został wysłany'
    );
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

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.passwordReset.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.passwordReset.create).mockResolvedValue({
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
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe(
      'Jeśli konto istnieje, email z instrukcjami został wysłany'
    );
    expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    });
    expect(prisma.passwordReset.create).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(
      new Error('Database error')
    );

    const req = new NextRequest('http://localhost:3000/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Nie udało się przetworzyć żądania');
  });
});
