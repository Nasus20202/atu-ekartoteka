import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/register/route';

// Mock dependencies
vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => Promise.resolve('hashed-password')),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    emailVerification: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email/email-service', () => ({
  getEmailService: vi.fn(() => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/email/verification-utils', () => ({
  generateSecureToken: vi.fn(() => 'test-secure-token-123'),
  getVerificationExpiration: vi.fn(() => new Date(Date.now() + 86400000)),
}));

vi.mock('@/lib/notifications/new-user-registration', () => ({
  notifyAdminsOfNewUser: vi.fn().mockResolvedValue(undefined),
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
  isTurnstileEnabled: vi.fn(() => false),
  verifyTurnstileToken: vi.fn(() => Promise.resolve(true)),
}));

const { prisma } = await import('@/lib/database/prisma');
const { notifyAdminsOfNewUser } =
  await import('@/lib/notifications/new-user-registration');

describe('POST /api/register - Admin Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should notify admins when regular user registers', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.count).mockResolvedValue(1); // Not first user
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      name: 'New User',
      password: 'hashed',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        isFirstAdmin: false,
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    expect(notifyAdminsOfNewUser).toHaveBeenCalledWith(
      'newuser@example.com',
      'New User',
      expect.any(Date)
    );
  });

  it('should NOT notify admins when first admin registers', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.count).mockResolvedValue(0); // First user
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'hashed',
      role: 'ADMIN',
      status: 'APPROVED',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        isFirstAdmin: true,
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    expect(notifyAdminsOfNewUser).not.toHaveBeenCalled();
  });

  it('should continue registration even if admin notification fails', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.count).mockResolvedValue(1);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      name: 'New User',
      password: 'hashed',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Simulate notification failure
    vi.mocked(notifyAdminsOfNewUser).mockRejectedValueOnce(
      new Error('Notification error')
    );

    const req = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        isFirstAdmin: false,
        turnstileToken: 'test-turnstile-token',
      }),
    });

    const response = await POST(req);

    // Registration should still succeed
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe('newuser@example.com');
  });

  it('should use "Brak imienia" if name is not provided', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.count).mockResolvedValue(1);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      name: null,
      password: 'hashed',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        isFirstAdmin: false,
        turnstileToken: 'test-turnstile-token',
      }),
    });

    await POST(req);

    expect(notifyAdminsOfNewUser).toHaveBeenCalledWith(
      'newuser@example.com',
      'Brak imienia',
      expect.any(Date)
    );
  });
});
