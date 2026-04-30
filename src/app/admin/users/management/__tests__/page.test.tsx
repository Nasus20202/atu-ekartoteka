import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BulkCreateUsersPage from '@/app/admin/users/management/page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/layout/page', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
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

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? <div role="dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="dialog-confirm" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="dialog-cancel">{children}</button>
  ),
}));

global.fetch = vi.fn();

const mockHoas = [
  {
    hoaId: 'hoa-1',
    hoaName: 'Wspólnota Alfa',
    apartments: [
      {
        id: 'apt-1',
        number: '10',
        building: 'A',
        owner: 'Jan Kowalski',
        email: 'jan@example.com',
        isActive: true,
        hasTwinWithTenant: false,
      },
      {
        id: 'apt-2',
        number: '20',
        building: 'B',
        owner: 'Anna Nowak',
        email: 'anna@example.com',
        isActive: true,
        hasTwinWithTenant: false,
      },
    ],
  },
  {
    hoaId: 'hoa-2',
    hoaName: 'Wspólnota Beta',
    apartments: [
      {
        id: 'apt-3',
        number: '5',
        building: null,
        owner: null,
        email: 'mieszkaniec@example.com',
        isActive: true,
        hasTwinWithTenant: false,
      },
    ],
  },
];

function expandHoa(hoaName: string) {
  fireEvent.click(screen.getByText(hoaName));
}

describe('BulkCreateUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hoas: mockHoas }),
    } as Response);
  });

  it('renders HOA names collapsed by default', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
      expect(screen.getByText('Wspólnota Beta')).toBeInTheDocument();
    });

    expect(screen.queryByText(/jan@example\.com/i)).not.toBeInTheDocument();
  });

  it('shows apartment content after expanding HOA', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');
    expandHoa('Wspólnota Beta');

    expect(screen.getByText(/jan@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/anna@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/mieszkaniec@example\.com/i)).toBeInTheDocument();
  });

  it('renders empty state when no unassigned apartments', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hoas: [] }),
    } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Brak mieszkań bez kont/i)).toBeInTheDocument();
    });
  });

  it('confirm button is disabled when nothing is selected', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    expect(button).toBeDisabled();
  });

  it('selects individual apartment and enables confirm button', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    const checkbox = screen.getByLabelText(/mieszkanie 10/i);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano 1 z 3/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    expect(button).not.toBeDisabled();
  });

  it('select-all checkbox appears after expanding and selects all apartments in that HOA', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    const hoaCheckbox = screen.getByLabelText(
      /Zaznacz wszystkie w Wspólnota Alfa/i
    );
    fireEvent.click(hoaCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano 2 z 3/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog with account list before creating', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    const checkbox = screen.getByLabelText(/mieszkanie 10/i);
    fireEvent.click(checkbox);

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Potwierdź tworzenie kont/i)).toBeInTheDocument();
      expect(screen.getByText('jan@example.com')).toBeInTheDocument();
    });
  });

  it('calls POST API and shows result summary on success after confirmation', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hoas: mockHoas }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ created: 2, skipped: 0, errors: 0 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hoas: [] }),
      } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    const hoaCheckbox = screen.getByLabelText(
      /Zaznacz wszystkie w Wspólnota Alfa/i
    );
    fireEvent.click(hoaCheckbox);

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Potwierdź tworzenie kont/i)).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Potwierdź i utwórz/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Utworzono 2 kont/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/bulk-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('apt-1'),
    });
  });

  it('shows error alert on API failure after confirmation', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hoas: mockHoas }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Błąd serwera' }),
      } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    const checkbox = screen.getByLabelText(/mieszkanie 10/i);
    fireEvent.click(checkbox);

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Potwierdź tworzenie kont/i)).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Potwierdź i utwórz/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Błąd serwera/i)).toBeInTheDocument();
    });
  });

  it('shows duplicate-address warning when two apartments share the same building and number', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hoas: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota Alfa',
            apartments: [
              {
                id: 'apt-1',
                number: '4',
                building: '52',
                owner: 'Wujczak Katarzyna',
                email: 'i-r-q@o2.pl',
                isActive: true,
                hasTwinWithTenant: false,
              },
              {
                id: 'apt-2',
                number: '4',
                building: '52',
                owner: 'Ossowska-Zając Grażyna',
                email: 'grazynaossowska@o2.pl',
                isActive: true,
                hasTwinWithTenant: false,
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    expect(screen.getByText(/Duplikat/i)).toBeInTheDocument();
  });

  it('shows occupied-twin warning when an apartment shares address with an already-assigned one', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hoas: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota Alfa',
            apartments: [
              {
                id: 'apt-1',
                number: '4',
                building: '52',
                owner: 'Nowy Właściciel',
                email: 'nowy@example.com',
                isActive: true,
                hasTwinWithTenant: true,
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    expect(
      screen.getByText(/Mieszkanie o tym adresie zostało już przypisane/i)
    ).toBeInTheDocument();
  });

  it('groups apartments in a blue box when one email has 3 or more apartments', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hoas: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota Alfa',
            apartments: [
              {
                id: 'apt-1',
                number: '1',
                building: 'A',
                owner: 'Jan Kowalski',
                email: 'jan@example.com',
                isActive: true,
                hasTwinWithTenant: false,
              },
              {
                id: 'apt-2',
                number: '2',
                building: 'A',
                owner: 'Jan Kowalski',
                email: 'jan@example.com',
                isActive: true,
                hasTwinWithTenant: false,
              },
              {
                id: 'apt-3',
                number: '3',
                building: 'A',
                owner: 'Jan Kowalski',
                email: 'jan@example.com',
                isActive: true,
                hasTwinWithTenant: false,
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    expect(screen.getByText('jan@example.com')).toBeInTheDocument();
    expect(screen.getAllByText(/3 mieszkania/i).length).toBeGreaterThan(0);
  });

  it('allows individual apartments in a duplicate group to be selected independently', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hoas: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota Alfa',
            apartments: [
              {
                id: 'apt-1',
                number: '4',
                building: '52',
                owner: 'Wujczak Katarzyna',
                email: 'i-r-q@o2.pl',
                isActive: true,
                hasTwinWithTenant: false,
              },
              {
                id: 'apt-2',
                number: '4',
                building: '52',
                owner: 'Ossowska-Zając Grażyna',
                email: 'grazynaossowska@o2.pl',
                isActive: true,
                hasTwinWithTenant: false,
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    const firstCheckbox = screen.getByLabelText(/i-r-q@o2\.pl/i);
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano 1 z 2/i)).toBeInTheDocument();
    });
  });

  it('does not show warning when same email but different addresses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hoas: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota Alfa',
            apartments: [
              {
                id: 'apt-1',
                number: '10',
                building: 'A',
                owner: 'Jan Kowalski',
                email: 'shared@example.com',
                isActive: true,
                hasTwinWithTenant: false,
              },
              {
                id: 'apt-2',
                number: '20',
                building: 'A',
                owner: 'Jan Kowalski',
                email: 'shared@example.com',
                isActive: true,
                hasTwinWithTenant: false,
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    expandHoa('Wspólnota Alfa');

    expect(screen.queryByText(/Duplikat/i)).not.toBeInTheDocument();
    const infoBadges = screen
      .queryAllByText(/2 mieszkania/i)
      .filter((el) => el.closest('[class*="blue"]') !== null);
    expect(infoBadges).toHaveLength(0);
  });

  describe('Assign existing tab', () => {
    it('switches to assign tab and fetches with mode=assignable', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: mockHoas }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [mockHoas[0]] }),
        } as Response);

      render(<BulkCreateUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('tab', { name: /przypisz istniejące/i })
      );

      await waitFor(() => {
        const calls = vi.mocked(fetch).mock.calls;
        expect(
          calls.some(
            (c) => typeof c[0] === 'string' && c[0].includes('mode=assignable')
          )
        ).toBe(true);
      });
    });

    it('shows empty state when no assignable apartments', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: mockHoas }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [] }),
        } as Response);

      render(<BulkCreateUsersPage />);

      await waitFor(() => screen.getByText('Wspólnota Alfa'));

      await user.click(
        screen.getByRole('tab', { name: /przypisz istniejące/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Brak mieszkań do przypisania/i)
        ).toBeInTheDocument();
      });
    });

    it('calls bulk-assign API and shows assign result on success', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: mockHoas }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [mockHoas[0]] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ assigned: 2, skipped: 0, errors: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [] }),
        } as Response);

      render(<BulkCreateUsersPage />);

      await waitFor(() => screen.getByText('Wspólnota Alfa'));

      await user.click(
        screen.getByRole('tab', { name: /przypisz istniejące/i })
      );

      await waitFor(() => {
        const calls = vi.mocked(fetch).mock.calls;
        expect(
          calls.some(
            (c) => typeof c[0] === 'string' && c[0].includes('mode=assignable')
          )
        ).toBe(true);
      });

      expandHoa('Wspólnota Alfa');

      const hoaCheckbox = screen.getByLabelText(
        /Zaznacz wszystkie w Wspólnota Alfa/i
      );
      await user.click(hoaCheckbox);

      const assignButtons = screen.getAllByRole('button', {
        name: /przypisz konta/i,
      });
      await user.click(assignButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Przypisano 2 mieszkań/i)).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith('/api/admin/users/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('apt'),
      });
    });
  });
});
