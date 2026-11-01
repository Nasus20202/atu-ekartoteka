import { describe, expect, it } from 'vitest';

import { isApprovedAccount } from '@/lib/auth/account-access';
import { AccountStatus } from '@/lib/types';

describe('isApprovedAccount', () => {
  it('accepts an approved account', () => {
    expect(isApprovedAccount({ status: AccountStatus.APPROVED })).toBe(true);
  });

  it.each([AccountStatus.PENDING, AccountStatus.REJECTED])(
    'rejects an account with status %s',
    (status) => {
      expect(isApprovedAccount({ status })).toBe(false);
    }
  );

  it('rejects a missing account', () => {
    expect(isApprovedAccount(null)).toBe(false);
  });
});
