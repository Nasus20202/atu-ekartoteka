import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApartmentSelectionDialog } from '@/app/admin/users/apartment-selection-dialog';
import { AccountStatus, UserRole } from '@/lib/types';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

const confirmMock = vi.fn().mockResolvedValue(true);

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id: string;
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));

const selectedUser: UserDto = {
  id: 'user-1',
  email: 'jan@example.com',
  name: 'Jan Kowalski',
  role: UserRole.TENANT,
  status: AccountStatus.PENDING,
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  apartments: [],
};

const apartment: ApartmentSummaryDto = {
  id: 'apt-1',
  externalOwnerId: 'owner-1',
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
  isActive: true,
};

describe('ApartmentSelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock.mockResolvedValue(true);
  });

  it('asks for confirmation before selecting an inactive apartment', async () => {
    const user = userEvent.setup();
    const onSelectApartment = vi.fn();

    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode="approve"
        filteredApartments={[{ ...apartment, id: 'apt-2', isActive: false }]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={() => {}}
        onReject={() => {}}
        onSelectApartment={onSelectApartment}
        onSetApproved={() => {}}
        open
        selectedApartments={[]}
        selectedUser={selectedUser}
      />
    );

    await user.click(screen.getByLabelText(/lipowa 10\/2/i));

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nieaktywne mieszkanie' })
    );
    expect(onSelectApartment).toHaveBeenCalledWith('apt-2', true);
  });

  it('does not select an inactive apartment when confirmation is rejected', async () => {
    const user = userEvent.setup();
    const onSelectApartment = vi.fn();
    confirmMock.mockResolvedValueOnce(false);

    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode="approve"
        filteredApartments={[{ ...apartment, id: 'apt-2', isActive: false }]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={() => {}}
        onReject={() => {}}
        onSelectApartment={onSelectApartment}
        onSetApproved={() => {}}
        open
        selectedApartments={[]}
        selectedUser={selectedUser}
      />
    );

    await user.click(screen.getByLabelText(/lipowa 10\/2/i));

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(onSelectApartment).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode={null}
        filteredApartments={[]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={() => {}}
        onReject={() => {}}
        onSelectApartment={() => {}}
        onSetApproved={() => {}}
        open={false}
        selectedApartments={[]}
        selectedUser={null}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders approval mode and emits search/select/approve/cancel actions', async () => {
    const user = userEvent.setup();
    const onApartmentSearchChange = vi.fn();
    const onApproveOrAssign = vi.fn();
    const onCancel = vi.fn();
    const onSelectApartment = vi.fn();

    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode="approve"
        filteredApartments={[apartment]}
        onApartmentSearchChange={onApartmentSearchChange}
        onApproveOrAssign={onApproveOrAssign}
        onCancel={onCancel}
        onReject={vi.fn()}
        onSelectApartment={onSelectApartment}
        onSetApproved={vi.fn()}
        open
        selectedApartments={[]}
        selectedUser={selectedUser}
      />
    );

    expect(screen.getByText(/zatwierdź konto/i)).toBeInTheDocument();
    expect(screen.getByText(/dopasowanie/i)).toBeInTheDocument();
    expect(screen.getByText(/25%/i)).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/przypisz mieszkanie \(opcjonalne\)/i),
      'lip'
    );
    await user.click(screen.getByLabelText(/lipowa 10\/2/i));
    await user.click(screen.getByRole('button', { name: /^zatwierdź$/i }));
    await user.click(screen.getByRole('button', { name: /anuluj/i }));

    expect(onApartmentSearchChange).toHaveBeenCalled();
    expect(onSelectApartment).toHaveBeenCalledWith('apt-1', true);
    expect(onApproveOrAssign).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders assign mode with selected count and empty search state', () => {
    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch="zzz"
        editMode="assign-apartment"
        filteredApartments={[]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={() => {}}
        onReject={() => {}}
        onSelectApartment={() => {}}
        onSetApproved={() => {}}
        open
        selectedApartments={['apt-1', 'apt-2']}
        selectedUser={{ ...selectedUser, status: AccountStatus.APPROVED }}
      />
    );

    expect(screen.getByText(/przypisz mieszkanie/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /przypisz \(2\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/nie znaleziono mieszkań/i)).toBeInTheDocument();
  });

  it('renders change-status mode and emits status actions', async () => {
    const user = userEvent.setup();
    const onSetApproved = vi.fn();
    const onReject = vi.fn();
    const onCancel = vi.fn();

    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode="change-status"
        filteredApartments={[]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={onCancel}
        onReject={onReject}
        onSelectApartment={() => {}}
        onSetApproved={onSetApproved}
        open
        selectedApartments={[]}
        selectedUser={{ ...selectedUser, status: AccountStatus.PENDING }}
      />
    );

    expect(screen.getByText(/zmień status użytkownika/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /zatwierdzony/i }));
    await user.click(screen.getByRole('button', { name: /odrzucony/i }));
    await user.click(screen.getByRole('button', { name: /anuluj/i }));

    expect(onSetApproved).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('highlights apartments by selection, match and activity', () => {
    const unmatchedUser = {
      ...selectedUser,
      name: null,
      email: 'nobody@example.com',
    };
    const other = { ...apartment, owner: 'Ktoś', email: null };

    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode="assign-apartment"
        filteredApartments={[
          { ...other, id: 'selected' },
          { ...other, id: 'matching', email: 'nobody@example.com' },
          { ...other, id: 'inactive', isActive: false },
          { ...other, id: 'plain', shareDenominator: null },
        ]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={() => {}}
        onReject={() => {}}
        onSelectApartment={() => {}}
        onSetApproved={() => {}}
        open
        selectedApartments={['selected']}
        selectedUser={unmatchedUser}
      />
    );

    const row = (id: string) =>
      document.querySelector(`label[for="apt-${id}"]`) as HTMLElement;

    expect(screen.getByText('nobody@example.com')).toBeInTheDocument();
    expect(row('selected')).toHaveClass('border-primary');
    expect(row('matching')).toHaveClass('border-green-500');
    expect(row('inactive')).toHaveClass('opacity-60');
    expect(row('plain')).not.toHaveClass('opacity-60');
    expect(row('plain')).toHaveTextContent('Procent: -');
  });

  it.each([
    [AccountStatus.APPROVED, /^zatwierdzony$/i],
    [AccountStatus.REJECTED, /^odrzucony$/i],
  ])('disables the current %s status', (status, name) => {
    render(
      <ApartmentSelectionDialog
        actionLoading={false}
        apartmentSearch=""
        editMode="change-status"
        filteredApartments={[]}
        onApartmentSearchChange={() => {}}
        onApproveOrAssign={() => {}}
        onCancel={() => {}}
        onReject={() => {}}
        onSelectApartment={() => {}}
        onSetApproved={() => {}}
        open
        selectedApartments={[]}
        selectedUser={{ ...selectedUser, status }}
      />
    );

    expect(screen.getByRole('button', { name })).toBeDisabled();
  });
});
