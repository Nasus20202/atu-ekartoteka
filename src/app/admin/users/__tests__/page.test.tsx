import { screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderSuspended } from '@/__tests__/render-suspended';
import AdminUsersPage from '@/app/admin/users/page';

const pending = vi.hoisted(() => ({ section: false }));
const modeMock = vi.hoisted(() => ({ value: 'cards' }));

vi.mock('@/lib/framework/list-view-mode-server', () => ({
  getListViewMode: () => Promise.resolve(modeMock.value),
}));

vi.mock('@/components/users/admin-users-section', () => ({
  AdminUsersSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>users-loaded</div>;
  },
}));

vi.mock('@/lib/framework/auth/require-admin-access', () => ({
  requireAdminAccess: vi.fn(),
}));

describe('AdminUsersPage', () => {
  it('renders the users when they are ready', async () => {
    pending.section = false;
    await renderSuspended(await AdminUsersPage());

    expect(screen.getByText('users-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the users load', async () => {
    pending.section = true;
    modeMock.value = 'cards';
    await renderSuspended(await AdminUsersPage());

    expect(screen.queryByText('users-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('users-page-skeleton')).toBeInTheDocument();
    expect(
      screen.queryByTestId('users-table-skeleton')
    ).not.toBeInTheDocument();
  });

  it('shows a table skeleton when the user chose the table view', async () => {
    pending.section = true;
    modeMock.value = 'table';
    await renderSuspended(await AdminUsersPage());

    expect(screen.getByTestId('users-table-skeleton')).toBeInTheDocument();
  });
});
