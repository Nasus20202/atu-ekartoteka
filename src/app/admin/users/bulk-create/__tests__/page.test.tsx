import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BulkCreateUsersPage from '@/app/admin/users/bulk-create/page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/page', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/page-header', () => ({
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
      },
      {
        id: 'apt-2',
        number: '20',
        building: 'B',
        owner: 'Anna Nowak',
        email: 'anna@example.com',
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
      },
    ],
  },
];

describe('BulkCreateUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hoas: mockHoas }),
    } as Response);
  });

  it('renders the list grouped by HOA', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
      expect(screen.getByText('Wspólnota Beta')).toBeInTheDocument();
    });

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

    const checkbox = screen.getByLabelText(/mieszkanie 10/i);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano 1 z 3/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    expect(button).not.toBeDisabled();
  });

  it('select-all HOA checkbox selects all apartments in that HOA', async () => {
    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    const hoaCheckbox = screen.getByLabelText(
      /Zaznacz wszystkie w Wspólnota Alfa/i
    );
    fireEvent.click(hoaCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano 2 z 3/i)).toBeInTheDocument();
    });
  });

  it('calls POST API and shows result summary on success', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hoas: mockHoas }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ created: 2, skipped: 0, errors: 0 }),
      } as Response)
      // After refresh
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hoas: [] }),
      } as Response);

    render(<BulkCreateUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Wspólnota Alfa')).toBeInTheDocument();
    });

    const hoaCheckbox = screen.getByLabelText(
      /Zaznacz wszystkie w Wspólnota Alfa/i
    );
    fireEvent.click(hoaCheckbox);

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Utworzono 2 kont/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/bulk-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('apt-1'),
    });
  });

  it('shows error alert on API failure', async () => {
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

    const checkbox = screen.getByLabelText(/mieszkanie 10/i);
    fireEvent.click(checkbox);

    const button = screen.getByRole('button', { name: /utwórz konta/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Błąd serwera/i)).toBeInTheDocument();
    });
  });
});
