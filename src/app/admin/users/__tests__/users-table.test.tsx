import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UsersTable } from '@/app/admin/users/users-table';
import { AccountStatus, UserRole } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';
import type { SortState, UserSortKey } from '@/lib/utils/sort';

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => <button onClick={onSelect}>{children}</button>,
}));

const apartment = {
  id: 'apt-1',
  externalOwnerId: 'own-1',
  externalApartmentId: 'ext-1',
  owner: 'Anna Nowak',
  email: 'anna@example.com',
  address: 'Lipowa',
  building: '10',
  number: '2',
  postalCode: '00-001',
  city: 'Warszawa',
  shareRatio: 0.25,
  isActive: true,
};

function createUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'user-1',
    email: 'anna@example.com',
    name: 'Anna Nowak',
    role: UserRole.TENANT,
    status: AccountStatus.APPROVED,
    emailVerified: true,
    mustChangePassword: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    apartments: [apartment, { ...apartment, id: 'apt-2' }],
    ...overrides,
  };
}

function renderTable(
  user: UserDto,
  sort: SortState<UserSortKey> | null = null
) {
  const handlers = {
    onOpenDialog: vi.fn(),
    onReject: vi.fn(),
    onSort: vi.fn(),
  };
  render(
    <UsersTable
      users={[user]}
      actionLoading={false}
      sort={sort}
      {...handlers}
    />
  );
  return handlers;
}

describe('UsersTable', () => {
  it('renders column headers and the user data', () => {
    renderTable(createUser());

    for (const header of ['Użytkownik', 'E-mail', 'Status', 'Mieszkania']) {
      expect(
        screen.getByRole('columnheader', { name: header })
      ).toBeInTheDocument();
    }

    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    expect(screen.getByText('Zatwierdzony')).toBeInTheDocument();
    expect(screen.getByText('2 mieszkania')).toBeInTheDocument();
    expect(screen.queryByText(/Zarejestrowano/)).not.toBeInTheDocument();
  });

  it('falls back to the email when the user has no name', () => {
    renderTable(createUser({ name: null, apartments: [] }));

    expect(screen.getAllByText('anna@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('0 mieszkań')).toBeInTheDocument();
  });

  it('opens the edit dialog from the row actions menu', async () => {
    const user = userEvent.setup();
    const handlers = renderTable(createUser());

    await user.click(screen.getByRole('button', { name: 'Akcje' }));
    await user.click(screen.getByRole('button', { name: /Mieszkania \(2\)/ }));
    await user.click(screen.getByRole('button', { name: /Zmień status/ }));

    expect(handlers.onOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'assign-apartment'
    );
    expect(handlers.onOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'change-status'
    );
  });

  it('rejects a pending user from the row actions menu', async () => {
    const user = userEvent.setup();
    const handlers = renderTable(
      createUser({ status: AccountStatus.PENDING, apartments: [] })
    );

    await user.click(screen.getByRole('button', { name: 'Akcje' }));
    await user.click(screen.getByRole('button', { name: /Zatwierdź/ }));
    await user.click(screen.getByRole('button', { name: /Odrzuć/ }));

    expect(handlers.onOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'approve'
    );
    expect(handlers.onReject).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' })
    );
  });

  it('asks for ascending sort when a header is clicked', async () => {
    const user = userEvent.setup();
    const handlers = renderTable(createUser());

    await user.click(screen.getByRole('button', { name: 'Użytkownik' }));

    expect(handlers.onSort).toHaveBeenCalledWith({
      key: 'name',
      direction: 'asc',
    });
  });

  it('asks for descending sort when the active header is clicked again', async () => {
    const user = userEvent.setup();
    const handlers = renderTable(createUser(), {
      key: 'name',
      direction: 'asc',
    });

    expect(
      screen.getByRole('columnheader', { name: 'Użytkownik' })
    ).toHaveAttribute('aria-sort', 'ascending');

    await user.click(screen.getByRole('button', { name: 'Użytkownik' }));

    expect(handlers.onSort).toHaveBeenCalledWith({
      key: 'name',
      direction: 'desc',
    });
  });

  it.each([
    ['Użytkownik', 'name'],
    ['E-mail', 'email'],
    ['Status', 'status'],
    ['Mieszkania', 'apartments'],
  ])('sorts by %s', async (header, key) => {
    const user = userEvent.setup();
    const handlers = renderTable(createUser());

    await user.click(screen.getByRole('button', { name: header }));

    expect(handlers.onSort).toHaveBeenCalledWith({ key, direction: 'asc' });
  });

  it('shows zero apartments when the list is missing', () => {
    renderTable(createUser({ apartments: undefined }));

    expect(screen.getByText('0 mieszkań')).toBeInTheDocument();
  });
});
