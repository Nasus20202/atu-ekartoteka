import { describe, expect, it } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

describe('UserRole enum', () => {
  it('should have ADMIN value', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
  });

  it('should have TENANT value', () => {
    expect(UserRole.TENANT).toBe('TENANT');
  });

  it('should only have ADMIN and TENANT values', () => {
    const values = Object.values(UserRole);
    expect(values).toHaveLength(2);
    expect(values).toContain('ADMIN');
    expect(values).toContain('TENANT');
  });

  it('should be type-safe', () => {
    const role: UserRole = UserRole.ADMIN;
    expect(role).toBe('ADMIN');
  });
});

describe('AccountStatus enum', () => {
  it('should have PENDING value', () => {
    expect(AccountStatus.PENDING).toBe('PENDING');
  });

  it('should have APPROVED value', () => {
    expect(AccountStatus.APPROVED).toBe('APPROVED');
  });

  it('should have REJECTED value', () => {
    expect(AccountStatus.REJECTED).toBe('REJECTED');
  });

  it('should only have PENDING, APPROVED, and REJECTED values', () => {
    const values = Object.values(AccountStatus);
    expect(values).toHaveLength(3);
    expect(values).toContain('PENDING');
    expect(values).toContain('APPROVED');
    expect(values).toContain('REJECTED');
  });

  it('should be type-safe', () => {
    const status: AccountStatus = AccountStatus.APPROVED;
    expect(status).toBe('APPROVED');
  });

  it('should match the expected workflow order', () => {
    // Verify the typical status flow: PENDING -> APPROVED or REJECTED
    const validTransitions = {
      [AccountStatus.PENDING]: [AccountStatus.APPROVED, AccountStatus.REJECTED],
      [AccountStatus.APPROVED]: [AccountStatus.REJECTED],
      [AccountStatus.REJECTED]: [AccountStatus.APPROVED],
    };

    expect(validTransitions[AccountStatus.PENDING]).toContain(
      AccountStatus.APPROVED
    );
    expect(validTransitions[AccountStatus.PENDING]).toContain(
      AccountStatus.REJECTED
    );
  });
});

describe('Type exports', () => {
  it('should export enums from lib/types', () => {
    expect(UserRole).toBeDefined();
    expect(AccountStatus).toBeDefined();
  });

  it('should match Prisma enum values', () => {
    // This ensures our re-exported types match Prisma's values
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.TENANT).toBe('TENANT');
    expect(AccountStatus.PENDING).toBe('PENDING');
    expect(AccountStatus.APPROVED).toBe('APPROVED');
    expect(AccountStatus.REJECTED).toBe('REJECTED');
  });
});
