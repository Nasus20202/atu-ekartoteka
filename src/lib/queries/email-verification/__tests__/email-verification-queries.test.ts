import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindFirst, mockFindUnique } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    emailVerification: {
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
    },
  },
}));

import { findRecentVerification } from '@/lib/queries/email-verification/find-recent-verification';
import {
  findVerificationByCode,
  findVerificationByCodeMinimal,
} from '@/lib/queries/email-verification/find-verification-by-code';

const NOW = new Date('2025-01-01T12:00:00.000Z');

describe('email verification queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('finds the latest verification created in the last five minutes', async () => {
    await findRecentVerification('user-1');

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        createdAt: { gte: new Date('2025-01-01T11:55:00.000Z') },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('finds a verification by code with its user', async () => {
    await findVerificationByCode('hash');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { code: 'hash' },
      include: { user: true },
    });
  });

  it('finds only the fields needed to check a verification', async () => {
    await findVerificationByCodeMinimal('hash');

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 'hash' },
        select: expect.objectContaining({
          verified: true,
          expiresAt: true,
          user: { select: { email: true, emailVerified: true } },
        }),
      })
    );
  });
});
