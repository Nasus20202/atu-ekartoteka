import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UsersList } from '@/app/admin/users/users-list';
import { ListViewMode } from '@/lib/hooks/use-list-view-mode';
import { AccountStatus, UserRole } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

vi.mock('@/app/admin/users/user-card', () => ({
  UserCard: ({
    user,
    onApprove,
    onAssignApartment,
    onChangeStatus,
    onReject,
  }: {
    user: UserDto;
    onApprove: () => void;
    onAssignApartment: () => void;
    onChangeStatus: () => void;
    onReject: () => void;
  }) => (
    <div data-testid="user-card">
      {user.email}
      <button onClick={onApprove}>approve</button>
      <button onClick={onAssignApartment}>assign</button>
      <button onClick={onChangeStatus}>status</button>
      <button onClick={onReject}>reject</button>
    </div>
  ),
}));

vi.mock('@/app/admin/users/users-table', () => ({
  UsersTable: ({
    users,
    onSort,
  }: {
    users: UserDto[];
    onSort: (sort: null) => void;
  }) => (
    <div data-testid="users-table">
      {users.length}
      <button onClick={() => onSort(null)}>sort</button>
    </div>
  ),
}));

const user: UserDto = {
  id: 'user-1',
  email: 'anna@example.com',
  name: 'Anna',
  role: UserRole.TENANT,
  status: AccountStatus.PENDING,
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  apartments: [],
};

function renderList(overrides: Partial<Parameters<typeof UsersList>[0]> = {}) {
  const props = {
    users: [user],
    loading: false,
    error: null,
    viewMode: ListViewMode.CARDS,
    search: '',
    filter: 'ALL' as const,
    actionLoading: false,
    onOpenDialog: vi.fn(),
    onReject: vi.fn(),
    sort: null,
    onSort: vi.fn(),
    ...overrides,
  };
  render(<UsersList {...props} />);
  return props;
}

describe('UsersList', () => {
  it('shows a loading card while loading', () => {
    renderList({ loading: true });

    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no users', () => {
    renderList({ users: [], search: 'xyz' });

    expect(screen.getByText('Brak użytkowników')).toBeInTheDocument();
  });

  it('does not show the empty state when an error is present', () => {
    renderList({ users: [], error: 'Błąd' });

    expect(screen.queryByText('Brak użytkowników')).not.toBeInTheDocument();
  });

  it('renders the table in table view mode and forwards sorting', async () => {
    const props = renderList({ viewMode: ListViewMode.TABLE });

    expect(screen.getByTestId('users-table')).toHaveTextContent('1');
    await userEvent.click(screen.getByRole('button', { name: 'sort' }));

    expect(props.onSort).toHaveBeenCalledWith(null);
  });

  it('maps card actions to dialog modes in card view', async () => {
    const props = renderList();
    const click = (name: string) =>
      userEvent.click(screen.getByRole('button', { name }));

    expect(screen.getAllByTestId('user-card')).toHaveLength(1);

    await click('approve');
    await click('assign');
    await click('status');
    await click('reject');

    expect(props.onOpenDialog).toHaveBeenNthCalledWith(1, user, 'approve');
    expect(props.onOpenDialog).toHaveBeenNthCalledWith(
      2,
      user,
      'assign-apartment'
    );
    expect(props.onOpenDialog).toHaveBeenNthCalledWith(
      3,
      user,
      'change-status'
    );
    expect(props.onReject).toHaveBeenCalledWith(user);
  });
});
