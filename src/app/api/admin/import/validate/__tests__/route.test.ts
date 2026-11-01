import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/import/validate-database', () => ({
  validateDatabase: vi.fn(),
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

    const response = await POST();

    expect(response.status).toBe(401);
    expect(validateDatabase).not.toHaveBeenCalled();
  });

  it('rejects non-admin users', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'u', email: 'u@example.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    } as never);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(validateDatabase).not.toHaveBeenCalled();
  });

  it('returns the validation result for admins', async () => {
    vi.mocked(auth).mockResolvedValueOnce(adminSession as never);
    vi.mocked(validateDatabase).mockResolvedValueOnce({
      success: true,
      results: [],
      errors: [],
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      results: [],
      errors: [],
    });
  });

  it('returns 500 when validation fails unexpectedly', async () => {
    vi.mocked(auth).mockResolvedValueOnce(adminSession as never);
    vi.mocked(validateDatabase).mockRejectedValueOnce(new Error('DB down'));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Walidacja danych nie powiodła się');
    expect(data.message).toBe('DB down');
  });
});
