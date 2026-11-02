import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLogout } from '@/components/account/use-logout';

const mockSignOut = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next-auth/react', () => ({
  signOut: (options: unknown) => mockSignOut(options),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}));

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
  });

  it('signs out without a full page redirect and navigates client-side', async () => {
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(result.current.pending).toBe(false);
  });

  it('does not navigate when sign out fails and clears the pending state', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await expect(result.current.logout()).rejects.toThrow('network');
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
  });
});
