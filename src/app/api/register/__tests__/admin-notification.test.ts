import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUserFindUnique,
  mockUserFindFirst,
  mockUserCreate,
  mockUserCount,
  mockEmailVerificationCreate,
  mockNotifyAdminsOfNewUser,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockUserCreate: vi.fn(),
  mockUserCount: vi.fn(),
  mockEmailVerificationCreate: vi.fn(),
  mockNotifyAdminsOfNewUser: vi.fn().mockResolvedValue(undefined),
}));

// Mock dependencies
vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => Promise.resolve('hashed-password')),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      findFirst: mockUserFindFirst,
      create: mockUserCreate,
      count: mockUserCount,
    },
    emailVerification: {
      create: mockEmailVerificationCreate,
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
  notifyAdminsOfNewUser: mockNotifyAdminsOfNewUser,
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

import { POST } from '@/app/api/register/route';

describe('POST /api/register - Admin Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should notify admins when regular user registers', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCount.mockResolvedValue(1); // Not first user
    mockUserCreate.mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      name: 'New User',
      password: 'hashed',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalledWith(
      'newuser@example.com',
      'New User',
      expect.any(Date)
    );
  });

  it('should NOT notify admins when first admin registers', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCount.mockResolvedValue(0); // First user
    mockUserCreate.mockResolvedValue({
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'hashed',
      role: 'ADMIN',
      status: 'APPROVED',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

    expect(mockNotifyAdminsOfNewUser).not.toHaveBeenCalled();
  });

  it('should continue registration even if admin notification fails', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCount.mockResolvedValue(1);
    mockUserCreate.mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      name: 'New User',
      password: 'hashed',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Simulate notification failure
    mockNotifyAdminsOfNewUser.mockRejectedValueOnce(
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
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCount.mockResolvedValue(1);
    mockUserCreate.mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      name: null,
      password: 'hashed',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalledWith(
      'newuser@example.com',
      'Brak imienia',
      expect.any(Date)
    );
  });
});
