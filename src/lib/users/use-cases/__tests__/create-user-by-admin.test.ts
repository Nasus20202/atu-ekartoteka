import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BCRYPT_COST } from '@/lib/auth/rules/bcrypt-cost';
import {
  CREDENTIALS_REQUIRED_MESSAGE,
  EMAIL_TAKEN_MESSAGE,
  INVALID_EMAIL_MESSAGE,
} from '@/lib/auth/rules/credential-validation';
import { PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/rules/password-rules';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { expectNoPersonalData } from '@/lib/platform/logging/testing';
import {
  type AdminUserCreation,
  createUserByAdmin,
} from '@/lib/users/use-cases/create-user-by-admin';

const { mockLog, mockBcryptHash, mockCreateAdminUser, mockFindUserByEmail } =
  vi.hoisted(() => ({
    mockLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    mockBcryptHash: vi.fn(),
    mockCreateAdminUser: vi.fn(),
    mockFindUserByEmail: vi.fn(),
  }));

vi.mock('bcrypt', () => ({ default: { hash: mockBcryptHash } }));

vi.mock('@/lib/users/mutations/create-admin-user', () => ({
  createAdminUser: mockCreateAdminUser,
}));

vi.mock('@/lib/users/queries/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLog,
}));

const NEW_EMAIL = 'new.user@example.com';

const CREATED_USER = {
  id: 'user-1',
  email: NEW_EMAIL,
  name: 'Anna Nowak',
  role: UserRole.TENANT,
  status: AccountStatus.PENDING,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

function request(
  overrides: Partial<AdminUserCreation> = {}
): AdminUserCreation {
  return {
    adminId: 'admin-1',
    email: NEW_EMAIL,
    password: 'correct-horse',
    name: 'Anna Nowak',
    role: undefined,
    status: undefined,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockBcryptHash.mockResolvedValue('hashed-password');
  mockFindUserByEmail.mockResolvedValue(null);
  mockCreateAdminUser.mockResolvedValue(CREATED_USER);
});

describe('createUserByAdmin', () => {
  it('creates a pending tenant account when only e-mail, password and name are given', async () => {
    const result = await createUserByAdmin(request());

    expect(result).toEqual({ ok: true, data: CREATED_USER });
    expect(mockFindUserByEmail).toHaveBeenCalledWith(NEW_EMAIL);
    expect(mockBcryptHash).toHaveBeenCalledWith('correct-horse', BCRYPT_COST);
    expect(mockCreateAdminUser).toHaveBeenCalledWith({
      email: NEW_EMAIL,
      hashedPassword: 'hashed-password',
      name: 'Anna Nowak',
      role: UserRole.TENANT,
      status: AccountStatus.PENDING,
    });
  });

  it('uses the role and status the admin selected', async () => {
    await createUserByAdmin(
      request({ role: UserRole.ADMIN, status: AccountStatus.APPROVED })
    );

    expect(mockCreateAdminUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
      })
    );
  });

  it('rejects a name that is not a string before any lookup or write', async () => {
    const result = await createUserByAdmin(request({ name: 42 }));

    expect(result).toEqual({
      ok: false,
      code: 'invalid',
      message: 'Nieprawidłowe imię',
    });
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
    expect(mockCreateAdminUser).not.toHaveBeenCalled();
  });

  it('stores an empty name as null', async () => {
    await createUserByAdmin(request({ name: '' }));

    expect(mockCreateAdminUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: null })
    );
  });

  it('logs the admin and the new account ID on success', async () => {
    await createUserByAdmin(request());

    expect(mockLog.info).toHaveBeenCalledWith(
      { adminId: 'admin-1', userId: 'user-1' },
      'Admin created user'
    );
  });

  it.each([
    {
      label: 'a missing e-mail',
      overrides: { email: undefined },
      message: CREDENTIALS_REQUIRED_MESSAGE,
    },
    {
      label: 'a missing password',
      overrides: { password: undefined },
      message: CREDENTIALS_REQUIRED_MESSAGE,
    },
    {
      label: 'a malformed e-mail',
      overrides: { email: 'not-an-email' },
      message: INVALID_EMAIL_MESSAGE,
    },
    {
      label: 'a password shorter than the minimum',
      overrides: { password: 'short' },
      message: PASSWORD_TOO_SHORT_MESSAGE,
    },
  ])(
    'rejects $label before any lookup or write',
    async ({ overrides, message }) => {
      const result = await createUserByAdmin(request(overrides));

      expect(result).toEqual({ ok: false, code: 'invalid', message });
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockCreateAdminUser).not.toHaveBeenCalled();
    }
  );

  it('rejects an unknown role before any lookup or write', async () => {
    const result = await createUserByAdmin(request({ role: 'SUPERUSER' }));

    expect(result).toEqual({
      ok: false,
      code: 'invalid',
      message: 'Nieprawidłowa rola',
    });
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
    expect(mockCreateAdminUser).not.toHaveBeenCalled();
  });

  it('rejects an unknown status before any lookup or write', async () => {
    const result = await createUserByAdmin(request({ status: 'SUSPENDED' }));

    expect(result).toEqual({
      ok: false,
      code: 'invalid',
      message: 'Nieprawidłowy status konta',
    });
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
    expect(mockCreateAdminUser).not.toHaveBeenCalled();
  });

  it('reports the role before the status when both are unknown', async () => {
    const result = await createUserByAdmin(
      request({ role: 'SUPERUSER', status: 'SUSPENDED' })
    );

    expect(result).toEqual({
      ok: false,
      code: 'invalid',
      message: 'Nieprawidłowa rola',
    });
  });

  it('refuses an e-mail that already has an account, logs without the e-mail and creates nothing', async () => {
    mockFindUserByEmail.mockResolvedValueOnce({ id: 'existing-user' });

    const result = await createUserByAdmin(request());

    expect(result).toEqual({
      ok: false,
      code: 'invalid',
      message: EMAIL_TAKEN_MESSAGE,
    });
    expect(mockLog.warn).toHaveBeenCalledWith(
      { adminId: 'admin-1' },
      'User creation failed: e-mail already in use'
    );
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockCreateAdminUser).not.toHaveBeenCalled();
    expectNoPersonalData(Object.values(mockLog), [NEW_EMAIL]);
  });

  it('returns a failed result and logs the error when the account cannot be stored', async () => {
    const error = new Error('Unique constraint failed');
    mockCreateAdminUser.mockRejectedValueOnce(error);

    const result = await createUserByAdmin(request());

    expect(result).toEqual({
      ok: false,
      code: 'failed',
      message: 'Nie udało się utworzyć użytkownika',
    });
    expect(mockLog.error).toHaveBeenCalledWith(
      { error },
      'Failed to create user'
    );
    expect(mockLog.info).not.toHaveBeenCalledWith(
      expect.anything(),
      'Admin created user'
    );
  });

  it('returns a failed result when the e-mail lookup throws, before hashing or writing', async () => {
    const error = new Error('DB down');
    mockFindUserByEmail.mockRejectedValueOnce(error);

    const result = await createUserByAdmin(request());

    expect(result).toEqual({
      ok: false,
      code: 'failed',
      message: 'Nie udało się utworzyć użytkownika',
    });
    expect(mockLog.error).toHaveBeenCalledWith(
      { error },
      'Failed to create user'
    );
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockCreateAdminUser).not.toHaveBeenCalled();
  });
});
