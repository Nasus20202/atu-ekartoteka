import { describe, expect, it, vi } from 'vitest';

const { mockUpdate, mockRedirect } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock('@/auth', () => ({ update: mockUpdate }));
vi.mock('next/navigation', () => ({ redirect: mockRedirect }));

import { refreshSessionAndRedirect } from '@/app/change-password/actions';

describe('refreshSessionAndRedirect', () => {
  it('refreshes the session before redirecting to the dashboard', async () => {
    await refreshSessionAndRedirect();

    expect(mockUpdate).toHaveBeenCalledWith({});
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mockRedirect.mock.invocationCallOrder[0]
    );
  });
});
