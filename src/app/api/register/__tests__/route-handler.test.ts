import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

const {
  mockFindUserByEmail,
  mockFindFirstAdmin,
  mockCreateUser,
  mockCreateEmailVerification,
  mockSendVerificationEmail,
  mockNotifyAdminsOfNewUser,
  mockCreateRegistrationAutoLoginToken,
  mockRecordRegistration,
} = vi.hoisted(() => ({
  mockFindUserByEmail: vi.fn(),
  mockFindFirstAdmin: vi.fn(),
  mockCreateUser: vi.fn(),
  mockCreateEmailVerification: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
  mockNotifyAdminsOfNewUser: vi.fn(),
  mockCreateRegistrationAutoLoginToken: vi.fn().mockReturnValue('mock-token'),
  mockRecordRegistration: vi.fn(),
}));

vi.mock('@/lib/queries/users/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));

vi.mock('@/lib/queries/users/find-first-admin', () => ({
  findFirstAdmin: mockFindFirstAdmin,
}));

vi.mock('@/lib/mutations/users/create-user', () => ({
  createUser: mockCreateUser,
}));

vi.mock('@/lib/mutations/email-verification/create-verification', () => ({
  createEmailVerification: mockCreateEmailVerification,
}));

vi.mock('@/lib/email/email-service', () => ({
  getEmailService: () => ({
    sendVerificationEmail: mockSendVerificationEmail,
  }),
}));

vi.mock('@/lib/notifications/new-user-registration', () => ({
  notifyAdminsOfNewUser: mockNotifyAdminsOfNewUser,
}));

vi.mock('@/lib/auth/registration-auto-login-token', () => ({
  createRegistrationAutoLoginToken: mockCreateRegistrationAutoLoginToken,
}));

vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordRegistration: mockRecordRegistration },
}));

vi.mock('@/lib/turnstile', () => ({
  isTurnstileEnabled: () => false,
  verifyTurnstileToken: vi.fn(),
}));

vi.mock('@/lib/email/verification-utils', () => ({
  generateSecureToken: () => 'secure-token',
  getVerificationExpiration: () => new Date(Date.now() + 86400_000),
  hashToken: (t: string) => `hashed-${t}`,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.TENANT,
    status: AccountStatus.PENDING,
    emailVerified: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('POST /api/register (route handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRegistrationAutoLoginToken.mockReturnValue('mock-token');
  });

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({ password: 'password123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it('returns 400 when password is missing', async () => {
    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({ email: 'test@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({ email: 'notanemail', password: 'password123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it('returns 400 when password is too short', async () => {
    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({ email: 'test@example.com', password: 'short' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/hasło/i);
  });

  it('returns 400 when user already exists', async () => {
    mockFindUserByEmail.mockResolvedValue(makeUser());
    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({
      email: 'test@example.com',
      password: 'password123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/już istnieje/i);
  });

  it('registers a new tenant user and sends verification email', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(makeUser());
    mockCreateEmailVerification.mockResolvedValue({});
    mockSendVerificationEmail.mockResolvedValue(undefined);
    mockNotifyAdminsOfNewUser.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requiresVerification).toBe(true);
    expect(body.autoLoginToken).toBe('mock-token');
    expect(mockSendVerificationEmail).toHaveBeenCalled();
    expect(mockNotifyAdminsOfNewUser).toHaveBeenCalled();
    expect(mockRecordRegistration).toHaveBeenCalledWith(
      'credentials',
      'success'
    );
  });

  it('registers first admin with ADMIN role and APPROVED status', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockFindFirstAdmin.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(
      makeUser({ role: UserRole.ADMIN, status: AccountStatus.APPROVED })
    );

    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({
      email: 'admin@example.com',
      password: 'adminpass123',
      isFirstAdmin: true,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requiresVerification).toBe(false);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    expect(mockNotifyAdminsOfNewUser).not.toHaveBeenCalled();
  });

  it('returns 400 when trying to register first admin but admin already exists', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockFindFirstAdmin.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));

    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({
      email: 'admin2@example.com',
      password: 'adminpass123',
      isFirstAdmin: true,
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/administrator już istnieje/i);
  });

  it('still returns 201 when verification email fails to send', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(makeUser());
    mockCreateEmailVerification.mockResolvedValue({});
    mockSendVerificationEmail.mockRejectedValue(new Error('SMTP error'));
    mockNotifyAdminsOfNewUser.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({
      email: 'test@example.com',
      password: 'password123',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockFindUserByEmail.mockRejectedValue(new Error('DB connection failed'));

    const { POST } = await import('@/app/api/register/route');
    const req = makeRequest({
      email: 'test@example.com',
      password: 'password123',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/nie udało się/i);
    expect(mockRecordRegistration).toHaveBeenCalledWith(
      'credentials',
      'failure'
    );
  });
});
