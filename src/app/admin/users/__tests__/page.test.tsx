import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminUsersPage from '@/app/admin/users/page';

const confirmMock = vi.fn();
const pendingCountMock = vi.hoisted(() => ({ value: 0 }));

vi.mock('@/app/admin/users/use-pending-count', () => ({
  usePendingCount: () => ({
    pendingCount: pendingCountMock.value,
    reload: () => {},
  }),
}));

vi.mock('@/components/layout/page', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({
    title,
    description,
    action,
  }: {
    title: string;
    description?: string;
    action?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {action}
    </div>
  ),
}));

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('@/components/ui/loading-card', () => ({
  LoadingCard: () => <div>Ładowanie...</div>,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

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
  DropdownMenuRadioGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuRadioItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => <button onClick={onSelect}>{children}</button>,
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

global.fetch = vi.fn();
global.alert = vi.fn();

function usersResponse(users: unknown[] = []) {
  return {
    ok: true,
    json: async () => ({ users, pagination: { totalPages: 1 } }),
  } as Response;
}

const pendingUser = {
  id: 'user-1',
  email: 'pending@example.com',
  name: 'Jan Kowalski',
  role: 'TENANT',
  status: 'PENDING',
  emailVerified: false,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  apartments: [],
};

const approvedUser = {
  id: 'user-2',
  email: 'approved@example.com',
  name: 'Anna Nowak',
  role: 'TENANT',
  status: 'APPROVED',
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  apartments: [
    {
      id: 'apt-1',
      externalOwnerId: 'own-1',
      externalApartmentId: 'ext-1',
      owner: 'Anna Nowak',
      email: 'approved@example.com',
      address: 'Lipowa',
      building: '10',
      number: '2',
      postalCode: '00-001',
      city: 'Warszawa',
      shareNumerator: 1,
      shareDenominator: 2,
      isActive: true,
    },
  ],
};

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    confirmMock.mockResolvedValue(true);
    pendingCountMock.value = 0;
    vi.mocked(fetch).mockResolvedValue(usersResponse());
  });

  it('renders Administratorzy filter and requests admin users when clicked', async () => {
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users?status=PENDING&page=1',
        expect.anything()
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /administratorzy/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users?role=ADMIN&page=1',
        expect.anything()
      );
    });
  });

  it('shows pending description and empty state message for pending filter', async () => {
    pendingCountMock.value = 1;
    vi.mocked(fetch).mockResolvedValueOnce(usersResponse([pendingUser]));

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/1 konto oczekuje na zatwierdzenie/i)
      ).toBeInTheDocument();
    });

    vi.mocked(fetch).mockResolvedValueOnce(usersResponse([]));
    fireEvent.click(screen.getByRole('button', { name: /wszyscy/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/nie znaleziono użytkowników/i)
      ).toBeInTheDocument();
    });
  });

  it('opens create user dialog and validates required fields', async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/użytkownicy/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /dodaj użytkownika/i })
    );
    await user.click(screen.getByRole('button', { name: /^utwórz$/i }));

    expect(screen.getByText(/dodaj nowego użytkownika/i)).toBeInTheDocument();
    expect(alert).toHaveBeenCalledWith('Email i hasło są wymagane');
  });

  it('opens approval dialog and loads apartments for pending user', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([pendingUser]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          apartments: [
            {
              id: 'apt-2',
              externalOwnerId: 'own-2',
              externalApartmentId: 'ext-2',
              owner: 'Jan Kowalski',
              email: 'pending@example.com',
              address: 'Polna',
              building: '3',
              number: '1',
              postalCode: '00-002',
              city: 'Warszawa',
              shareNumerator: 1,
              shareDenominator: 3,
              isActive: true,
            },
          ],
        }),
      } as Response);

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /zatwierdź/i })[0]
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /zatwierdź/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/zatwierdź konto/i)).toBeInTheDocument();
      expect(screen.getByText(/polna 3\/1/i)).toBeInTheDocument();
    });
  });

  it('asks for confirmation before selecting an inactive apartment', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([pendingUser]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          apartments: [
            {
              id: 'apt-2',
              externalOwnerId: 'own-2',
              externalApartmentId: 'ext-2',
              owner: 'Jan Kowalski',
              email: 'pending@example.com',
              address: 'Polna',
              building: '3',
              number: '1',
              postalCode: '00-002',
              city: 'Warszawa',
              shareNumerator: 1,
              shareDenominator: 3,
              isActive: false,
            },
          ],
        }),
      } as Response);

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /zatwierdź/i })[0]
      ).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /zatwierdź/i })[0]);
    await user.click(await screen.findByLabelText(/polna 3\/1/i));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Nieaktywne mieszkanie' })
      );
    });
  });

  it('switches to the table without reloading users', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(usersResponse([approvedUser]));

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/zarejestrowano/i)).toBeInTheDocument();
    });
    const requests = vi.mocked(fetch).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));

    expect(screen.queryByText(/zarejestrowano/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Użytkownik' })
    ).toBeInTheDocument();
    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('1 mieszkanie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(fetch).toHaveBeenCalledTimes(requests);
  });

  it('requests sorted users when a table header is clicked', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([approvedUser]))
      .mockResolvedValueOnce(usersResponse([approvedUser]));

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/zarejestrowano/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));
    fireEvent.click(screen.getByRole('button', { name: 'Użytkownik' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users?status=PENDING&page=1&sort=name&order=asc',
        expect.anything()
      );
    });
  });

  it('loads more users without page controls', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [pendingUser],
          pagination: { totalPages: 2 },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [approvedUser],
          pagination: { totalPages: 2 },
        }),
      } as Response);

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });
    expect(screen.queryByText(/strona 1 z 2/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /następna/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż więcej' }));

    await waitFor(() => {
      expect(screen.getByText('approved@example.com')).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/users?status=PENDING&page=2',
      expect.anything()
    );
    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pokaż więcej' })
    ).not.toBeInTheDocument();
  });

  it('creates a user successfully and resets the dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([]))
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce(usersResponse([approvedUser]));

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/użytkownicy/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /dodaj użytkownika/i })
    );
    await user.type(screen.getByLabelText(/^email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^hasło/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^utwórz$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/create',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(
      screen.queryByText(/dodaj nowego użytkownika/i)
    ).not.toBeInTheDocument();
  });

  it('shows api error when create user fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([]))
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User exists' }),
      } as Response);

    render(<AdminUsersPage />);

    await user.click(
      screen.getByRole('button', { name: /dodaj użytkownika/i })
    );
    await user.type(screen.getByLabelText(/^email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^hasło/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^utwórz$/i }));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('User exists');
    });
  });

  it('changes rejected user status to approved from dialog', async () => {
    const user = userEvent.setup();
    const rejectedUser = {
      ...approvedUser,
      id: 'user-3',
      status: 'REJECTED',
      apartments: [],
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([rejectedUser]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ apartments: [] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce(usersResponse([approvedUser]));

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /zmień status/i })[0]
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /zmień status/i })[0]
    );
    await user.click(screen.getByRole('button', { name: /^zatwierdzony$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('confirms apartment-removal rejection for approved user with apartments', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(usersResponse([approvedUser]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ apartments: [] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce(usersResponse([]));

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /zmień status/i })[0]
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /zmień status/i })[0]
    );
    await user.click(screen.getByRole('button', { name: /^odrzucony$/i }));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Odrzuć użytkownika' })
      );
    });
  });

  it('searches users from the first result page', async () => {
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users?status=PENDING&page=1',
        expect.anything()
      );
    });

    fireEvent.change(
      screen.getByPlaceholderText(/szukaj po imieniu, emailu lub mieszkaniu/i),
      { target: { value: 'anna' } }
    );

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/admin/users?status=PENDING&page=1&search=anna',
          expect.anything()
        );
      },
      { timeout: 1500 }
    );
  });
});
