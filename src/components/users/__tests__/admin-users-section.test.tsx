import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminUsersSection } from '@/components/users/admin-users-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  loadUsersPage: vi.fn(),
  content: vi.fn(),
}));

vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/app/api/admin/users/load-users-page', () => ({
  loadUsersPage: mocks.loadUsersPage,
}));
vi.mock('@/components/users/admin-users-content', () => ({
  AdminUsersContent: (props: unknown) => {
    mocks.content(props);
    return <div>users</div>;
  },
}));

describe('AdminUsersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.loadUsersPage.mockResolvedValue({
      users: [{ id: 'u1' }],
      pagination: { page: 1, limit: 50, total: 7, totalPages: 1 },
    });
  });

  it('loads the first page of pending tenants', async () => {
    render(await AdminUsersSection());

    expect(screen.getByText('users')).toBeInTheDocument();
    expect(mocks.loadUsersPage).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING', page: 1, role: 'TENANT' })
    );
    expect(mocks.content).toHaveBeenCalledWith({
      initialPage: {
        items: [{ id: 'u1' }],
        page: 1,
        limit: 50,
        total: 7,
        totalPages: 1,
      },
    });
  });

  it('does not load users when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(AdminUsersSection()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.loadUsersPage).not.toHaveBeenCalled();
  });
});
