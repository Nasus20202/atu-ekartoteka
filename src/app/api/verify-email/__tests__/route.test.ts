import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findVerificationByCode: vi.fn(),
  findVerificationByCodeMinimal: vi.fn(),
  verifyEmailTransaction: vi.fn(),
  isVerificationExpired: vi.fn(),
  recordEmailVerification: vi.fn(),
}));

vi.mock('@/lib/queries/email-verification/find-verification-by-code', () => ({
  findVerificationByCode: mocks.findVerificationByCode,
  findVerificationByCodeMinimal: mocks.findVerificationByCodeMinimal,
}));
vi.mock('@/lib/mutations/email-verification/verify-email-transaction', () => ({
  verifyEmailTransaction: mocks.verifyEmailTransaction,
}));
vi.mock('@/lib/email/verification-utils', () => ({
  hashToken: (token: string) => `hashed-${token}`,
  isVerificationExpired: mocks.isVerificationExpired,
}));
vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordEmailVerification: mocks.recordEmailVerification },
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { GET, POST } from '@/app/api/verify-email/route';

const URL_BASE = 'http://localhost/api/verify-email';
const verification = {
  id: 'verification-1',
  userId: 'user-1',
  verified: false,
  expiresAt: new Date('2030-01-01'),
  user: { email: 'jan@example.com', emailVerified: false },
};

function postRequest(body: unknown) {
  return new NextRequest(URL_BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findVerificationByCode.mockResolvedValue(verification);
    mocks.isVerificationExpired.mockReturnValue(false);
  });

  it('requires a token', async () => {
    const response = await POST(postRequest({}));

    expect(response.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    mocks.findVerificationByCode.mockResolvedValue(null);

    const response = await POST(postRequest({ token: 'abc' }));

    expect(mocks.findVerificationByCode).toHaveBeenCalledWith('hashed-abc');
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Nieprawidłowy token weryfikacyjny',
    });
  });

  it('rejects a token that was already used', async () => {
    mocks.findVerificationByCode.mockResolvedValue({
      ...verification,
      verified: true,
    });

    const response = await POST(postRequest({ token: 'abc' }));

    await expect(response.json()).resolves.toEqual({
      error: 'Ten token został już użyty',
    });
  });

  it('rejects an expired token', async () => {
    mocks.isVerificationExpired.mockReturnValue(true);

    const response = await POST(postRequest({ token: 'abc' }));

    expect(response.status).toBe(400);
    expect(mocks.verifyEmailTransaction).not.toHaveBeenCalled();
  });

  it('verifies the email and records the metric', async () => {
    const response = await POST(postRequest({ token: 'abc' }));

    expect(response.status).toBe(200);
    expect(mocks.verifyEmailTransaction).toHaveBeenCalledWith(
      'user-1',
      'verification-1'
    );
    expect(mocks.recordEmailVerification).toHaveBeenCalledWith('success');
  });

  it('returns 500 and records a failure when verification throws', async () => {
    mocks.verifyEmailTransaction.mockRejectedValue(new Error('db'));

    const response = await POST(postRequest({ token: 'abc' }));

    expect(response.status).toBe(500);
    expect(mocks.recordEmailVerification).toHaveBeenCalledWith('failure');
  });
});

describe('GET /api/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findVerificationByCodeMinimal.mockResolvedValue(verification);
    mocks.isVerificationExpired.mockReturnValue(false);
  });

  const getRequest = (query = '') => new NextRequest(`${URL_BASE}${query}`);

  it('requires a token', async () => {
    const response = await GET(getRequest());

    expect(response.status).toBe(400);
  });

  it('reports an unknown token as invalid', async () => {
    mocks.findVerificationByCodeMinimal.mockResolvedValue(null);

    const response = await GET(getRequest('?token=abc'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ valid: false });
  });

  it('reports a usable token as valid', async () => {
    const response = await GET(getRequest('?token=abc'));

    await expect(response.json()).resolves.toEqual({
      valid: true,
      expired: false,
      alreadyVerified: false,
    });
  });

  it('reports an expired token and an already verified user', async () => {
    mocks.isVerificationExpired.mockReturnValue(true);
    mocks.findVerificationByCodeMinimal.mockResolvedValue({
      ...verification,
      user: { ...verification.user, emailVerified: true },
    });

    const response = await GET(getRequest('?token=abc'));

    await expect(response.json()).resolves.toEqual({
      valid: false,
      expired: true,
      alreadyVerified: true,
    });
  });

  it('returns 500 when the lookup fails', async () => {
    mocks.findVerificationByCodeMinimal.mockRejectedValue(new Error('db'));

    const response = await GET(getRequest('?token=abc'));

    expect(response.status).toBe(500);
  });
});
