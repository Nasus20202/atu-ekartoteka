import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '@/generated/prisma/client';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { createUser } from '@/lib/users/mutations/create-user';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: { user: { create: mockCreate } },
}));

const INPUT = {
  email: ' Jan@Example.com ',
  hashedPassword: 'hash',
  name: 'Jan',
  role: UserRole.TENANT,
  status: AccountStatus.PENDING,
  emailVerified: false,
};

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('failure', {
    code,
    clientVersion: 'test',
  });
}

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the user with a normalised email', async () => {
    mockCreate.mockResolvedValue({ id: 'u1' });

    await expect(createUser(INPUT)).resolves.toEqual({ id: 'u1' });
    expect(mockCreate.mock.calls[0][0].data.email).toBe('jan@example.com');
  });

  it('returns null when the email is already registered', async () => {
    mockCreate.mockRejectedValue(knownError('P2002'));

    await expect(createUser(INPUT)).resolves.toBeNull();
  });

  it('rethrows any other database error', async () => {
    mockCreate.mockRejectedValue(knownError('P1001'));

    await expect(createUser(INPUT)).rejects.toThrow('failure');
  });
});
