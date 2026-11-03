import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import AdminUsersPage from '@/app/admin/users/page';

const pending = vi.hoisted(() => ({ section: false }));
const modeMock = vi.hoisted(() => ({ value: 'cards' }));

vi.mock('@/lib/list-view-mode-server', () => ({
  getListViewMode: () => Promise.resolve(modeMock.value),
}));

vi.mock('@/components/users/admin-users-section', () => ({
  AdminUsersSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>users-loaded</div>;
  },
}));

describe('AdminUsersPage', () => {
  it('renders the users when they are ready', async () => {
    pending.section = false;
    render(await AdminUsersPage());

    expect(screen.getByText('users-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the users load', async () => {
    pending.section = true;
    modeMock.value = 'cards';
    render(await AdminUsersPage());

    expect(screen.queryByText('users-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('users-page-skeleton')).toBeInTheDocument();
    expect(
      screen.queryByTestId('users-table-skeleton')
    ).not.toBeInTheDocument();
  });

  it('shows a table skeleton when the user chose the table view', async () => {
    pending.section = true;
    modeMock.value = 'table';
    render(await AdminUsersPage());

    expect(screen.getByTestId('users-table-skeleton')).toBeInTheDocument();
  });
});
