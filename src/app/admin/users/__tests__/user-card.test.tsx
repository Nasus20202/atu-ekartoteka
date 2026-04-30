import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/app/admin/users/types';
import { UserCard } from '@/app/admin/users/user-card';
import { AccountStatus, UserRole } from '@/lib/types';

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

function createUser(
  status: (typeof AccountStatus)[keyof typeof AccountStatus]
): User {
  return {
    id: `user-${status}`,
    email: `${status.toLowerCase()}@example.com`,
    name: 'Jan Kowalski',
    role: UserRole.TENANT,
    status,
    emailVerified: true,
    mustChangePassword: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    apartments:
      status === AccountStatus.APPROVED
        ? [
            {
              id: 'apt-1',
              externalOwnerId: 'own-1',
              externalApartmentId: 'ext-1',
              owner: 'Jan Kowalski',
              email: 'jan@example.com',
              address: 'Lipowa',
              building: '10',
              number: '2',
              postalCode: '00-001',
              city: 'Warszawa',
              shareNumerator: 1,
              shareDenominator: 4,
              isActive: false,
            },
          ]
        : [],
  };
}

describe('UserCard', () => {
  it('renders pending actions and calls handlers', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <UserCard
        actionLoading={false}
        onApprove={onApprove}
        onAssignApartment={vi.fn()}
        onChangeStatus={vi.fn()}
        onReject={onReject}
        user={createUser(AccountStatus.PENDING)}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /zatwierdź/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /odrzuć/i })[0]);

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('renders approved apartments and status actions', async () => {
    const user = userEvent.setup();
    const onAssignApartment = vi.fn();
    const onChangeStatus = vi.fn();

    render(
      <UserCard
        actionLoading={false}
        onApprove={vi.fn()}
        onAssignApartment={onAssignApartment}
        onChangeStatus={onChangeStatus}
        onReject={vi.fn()}
        user={createUser(AccountStatus.APPROVED)}
      />
    );

    expect(screen.getByText(/przypisane mieszkania: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/25.0%/i)).toBeInTheDocument();
    expect(screen.getByText(/nieaktywny/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /mieszkania/i })[0]);
    await user.click(
      screen.getAllByRole('button', { name: /zmień status/i })[0]
    );

    expect(onAssignApartment).toHaveBeenCalledTimes(1);
    expect(onChangeStatus).toHaveBeenCalledTimes(1);
  });

  it('renders rejected change status action only', () => {
    render(
      <UserCard
        actionLoading={false}
        onApprove={vi.fn()}
        onAssignApartment={vi.fn()}
        onChangeStatus={vi.fn()}
        onReject={vi.fn()}
        user={createUser(AccountStatus.REJECTED)}
      />
    );

    expect(
      screen.getAllByRole('button', { name: /zmień status/i })
    ).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: /^zatwierdź$/i })
    ).not.toBeInTheDocument();
  });
});
