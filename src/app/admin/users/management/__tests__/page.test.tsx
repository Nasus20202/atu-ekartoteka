import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

global.fetch = vi.fn();

const SINGLE_PAGE = { page: 1, totalPages: 1 };

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
      json: async () => ({ hoas: mockHoas, pagination: SINGLE_PAGE }),
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
      json: async () => ({ hoas: [], pagination: SINGLE_PAGE }),
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

    const button = screen.getByRole('button', { name: /zaproś użytkowników/i });
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

    const button = screen.getByRole('button', { name: /zaproś użytkowników/i });
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

    const button = screen.getByRole('button', { name: /zaproś użytkowników/i });
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
        json: async () => ({ hoas: mockHoas, pagination: SINGLE_PAGE }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ created: 2, skipped: 0, errors: 0 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hoas: [], pagination: SINGLE_PAGE }),
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

    const button = screen.getByRole('button', { name: /zaproś użytkowników/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Potwierdź tworzenie kont/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /Zaproś użytkowników/i,
      })
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
        json: async () => ({ hoas: mockHoas, pagination: SINGLE_PAGE }),
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

    const button = screen.getByRole('button', { name: /zaproś użytkowników/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Potwierdź tworzenie kont/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /Zaproś użytkowników/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Błąd serwera/i)).toBeInTheDocument();
    });
  });

  it('shows duplicate-address warning when two apartments share the same building and number', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        pagination: SINGLE_PAGE,
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
        pagination: SINGLE_PAGE,
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
        pagination: SINGLE_PAGE,
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
        pagination: SINGLE_PAGE,
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
        pagination: SINGLE_PAGE,
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

  describe('infinite scroll', () => {
    const page = (hoas: typeof mockHoas, number: number, totalPages = 2) =>
      ({
        ok: true,
        json: async () => ({
          hoas,
          pagination: { page: number, totalPages },
        }),
      }) as Response;

    it('does not offer more HOAs when everything is loaded', async () => {
      render(<BulkCreateUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('button', { name: 'Pokaż więcej' })
      ).not.toBeInTheDocument();
    });

    it('appends the next page of HOAs and keeps the selection', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch)
        .mockResolvedValueOnce(page([mockHoas[0]], 1))
        .mockResolvedValueOnce(page([mockHoas[1]], 2));

      render(<BulkCreateUsersPage />);

      await screen.findByText('Wspólnota Alfa');
      expandHoa('Wspólnota Alfa');
      fireEvent.click(screen.getByLabelText(/mieszkanie 10/i));
      expect(screen.getByText(/Wybrano 1 z 2/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Pokaż więcej' }));

      await waitFor(() => {
        expect(screen.getByText('Wspólnota Beta')).toBeInTheDocument();
      });
      expect(screen.getByText(/Wybrano 1 z 3/i)).toBeInTheDocument();
      expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
        '/api/admin/unassigned-apartments?mode=creatable&page=1',
        '/api/admin/unassigned-apartments?mode=creatable&page=2',
      ]);
      expect(
        screen.queryByRole('button', { name: 'Pokaż więcej' })
      ).not.toBeInTheDocument();
    });

    it('keeps the loaded HOAs and shows the error when loading more fails', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch)
        .mockResolvedValueOnce(page([mockHoas[0]], 1))
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Brak uprawnień' }),
        } as Response);

      render(<BulkCreateUsersPage />);

      await user.click(
        await screen.findByRole('button', { name: 'Pokaż więcej' })
      );

      expect(
        await screen.findByText('Nie udało się wczytać kolejnych pozycji')
      ).toBeInTheDocument();
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    it('offers a retry when the first page fails', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Brak uprawnień' }),
        } as Response)
        .mockResolvedValueOnce(page([mockHoas[0]], 1, 1));

      render(<BulkCreateUsersPage />);

      fireEvent.click(
        await screen.findByRole('button', { name: 'Pokaż więcej' })
      );

      expect(await screen.findByText('Wspólnota Alfa')).toBeInTheDocument();
    });
  });

  describe('Assign existing tab', () => {
    it('switches to assign tab and fetches with mode=assignable', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: mockHoas, pagination: SINGLE_PAGE }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [mockHoas[0]], pagination: SINGLE_PAGE }),
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
          json: async () => ({ hoas: mockHoas, pagination: SINGLE_PAGE }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [], pagination: SINGLE_PAGE }),
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
          json: async () => ({ hoas: mockHoas, pagination: SINGLE_PAGE }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [mockHoas[0]], pagination: SINGLE_PAGE }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ assigned: 2, skipped: 0, errors: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hoas: [], pagination: SINGLE_PAGE }),
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
