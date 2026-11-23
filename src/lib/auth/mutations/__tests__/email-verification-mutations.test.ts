import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreate,
  mockDeleteMany,
  mockDelete,
  mockUpdate,
  mockUserUpdate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockDelete: vi.fn(),
  mockUpdate: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    user: { update: mockUserUpdate },
    emailVerification: {
      create: mockCreate,
      deleteMany: mockDeleteMany,
      delete: mockDelete,
      updateMany: mockUpdate,
    },
  },
}));

import { createEmailVerification } from '@/lib/auth/mutations/create-verification';
import { deleteExpiredVerifications } from '@/lib/auth/mutations/delete-expired-verifications';
import {
  deleteOtherVerificationsForUser,
  deleteVerificationById,
} from '@/lib/auth/mutations/delete-verification-codes';
import { verifyEmailTransaction } from '@/lib/auth/mutations/verify-email-transaction';

const NOW = new Date('2025-01-01T12:00:00.000Z');

describe('email verification mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores the hashed code', async () => {
    const expiresAt = new Date('2025-01-02');

    await createEmailVerification({
      userId: 'user-1',
      hashedCode: 'hash',
      expiresAt,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 'user-1', code: 'hash', expiresAt },
    });
  });

  it('deletes expired and already used verifications', async () => {
    await deleteExpiredVerifications();

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { OR: [{ expiresAt: { lt: NOW } }, { verified: true }] },
    });
  });

  it('deletes one verification by id', async () => {
    await deleteVerificationById('code-1');

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'code-1' } });
  });

  it("deletes a user's other verifications and keeps the given one", async () => {
    await deleteOtherVerificationsForUser('user-1', 'code-1');

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', id: { not: 'code-1' } },
    });
  });

  it('consumes the verification and marks the user as verified', async () => {
    mockUpdate.mockResolvedValue({ count: 1 });
    mockTransaction.mockImplementation((callback) =>
      callback({
        emailVerification: { updateMany: mockUpdate },
        user: { update: mockUserUpdate },
      })
    );

    expect(await verifyEmailTransaction('user-1', 'verification-1')).toBe(true);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'verification-1', verified: false },
      data: { verified: true },
    });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { emailVerified: true },
    });
  });

  it('does not verify the user when the token was already consumed', async () => {
    mockUpdate.mockResolvedValue({ count: 0 });
    mockTransaction.mockImplementation((callback) =>
      callback({
        emailVerification: { updateMany: mockUpdate },
        user: { update: mockUserUpdate },
      })
    );

    expect(await verifyEmailTransaction('user-1', 'verification-1')).toBe(
      false
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});
