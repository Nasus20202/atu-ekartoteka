import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getListViewMode } from '@/lib/list-view-mode-server';

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

describe('getListViewMode', () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
  });

  it('returns the view stored in the cookie', async () => {
    cookieStore.get.mockReturnValue({ value: 'table' });

    await expect(getListViewMode('atu:list-view:users')).resolves.toBe('table');
    expect(cookieStore.get).toHaveBeenCalledWith('atu-list-view-users');
  });

  it('falls back to cards without a cookie', async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(getListViewMode('atu:list-view:users')).resolves.toBe('cards');
  });
});
