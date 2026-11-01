import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/import/validate-database', () => ({
  validateDatabase: vi.fn(),
}));

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: vi.fn().mockResolvedValue(true),
  isAdminRole: (role: string | null | undefined) => role === 'ADMIN',
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const { auth } = await import('@/auth');
const { validateDatabase } = await import('@/lib/import/validate-database');
const { POST } = await import('../route');

const ENDPOINT = 'http://localhost/api/admin/import/validate';

function postRequest(body?: unknown): NextRequest {
  return new NextRequest(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const adminSession = {
  user: { id: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
  expires: new Date().toISOString(),
};

describe('POST /api/admin/import/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(validateDatabase).not.toHaveBeenCalled();
  });

  it('rejects non-admin users', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'u', email: 'u@example.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    } as never);

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(validateDatabase).not.toHaveBeenCalled();
  });

  it('returns the validation result for admins', async () => {
    vi.mocked(auth).mockResolvedValueOnce(adminSession as never);
    vi.mocked(validateDatabase).mockResolvedValueOnce({
      success: true,
      results: [],
      errors: [],
      fullValidationSkipped: false,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      results: [],
      errors: [],
      fullValidationSkipped: false,
    });
    expect(validateDatabase).toHaveBeenCalledWith({
      skipFullValidation: false,
    });
  });

  it('skips the full validation when the request asks for it', async () => {
    vi.mocked(auth).mockResolvedValueOnce(adminSession as never);
    vi.mocked(validateDatabase).mockResolvedValueOnce({
      success: true,
      results: [],
      errors: [],
      fullValidationSkipped: true,
    });

    const response = await POST(postRequest({ skipFullValidation: true }));

    expect(response.status).toBe(200);
    expect(validateDatabase).toHaveBeenCalledWith({ skipFullValidation: true });
  });

  it('runs the full validation when the body is empty', async () => {
    vi.mocked(auth).mockResolvedValueOnce(adminSession as never);
    vi.mocked(validateDatabase).mockResolvedValueOnce({
      success: true,
      results: [],
      errors: [],
      fullValidationSkipped: false,
    });

    await POST(postRequest());

    expect(validateDatabase).toHaveBeenCalledWith({
      skipFullValidation: false,
    });
  });

  it('returns 500 when validation fails unexpectedly', async () => {
    vi.mocked(auth).mockResolvedValueOnce(adminSession as never);
    vi.mocked(validateDatabase).mockRejectedValueOnce(new Error('DB down'));

    const response = await POST(postRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Walidacja danych nie powiodła się');
    expect(data.message).toBe('DB down');
  });
});
