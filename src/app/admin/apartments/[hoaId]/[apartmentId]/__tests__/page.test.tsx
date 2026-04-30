import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApartmentDetailsPage from '@/app/admin/apartments/[hoaId]/[apartmentId]/page';

const confirmMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ hoaId: 'hoa-1', apartmentId: 'apt-1' }),
}));

vi.mock('@/components/layout/page', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  ),
}));

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('@/components/ui/loading-card', () => ({
  LoadingCard: () => <div>Ładowanie...</div>,
}));

vi.mock('@/components/charges/admin-charges-list', () => ({
  AdminChargesList: () => <div>Lista naliczeń</div>,
}));

vi.mock('@/components/payments/apartment-payments-section', () => ({
  ApartmentPaymentsSection: () => <div>Sekcja wpłat</div>,
}));

global.fetch = vi.fn();

describe('ApartmentDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock.mockResolvedValue(true);
  });

  it('shows not found message when apartment fetch fails', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

      render(<ApartmentDetailsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/nie znaleziono mieszkania/i)
        ).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch apartment:',
        expect.any(Error)
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('renders stringified notification dto values from the API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'apt-1',
        externalOwnerId: 'W1',
        externalApartmentId: 'A1',
        owner: 'Jan Kowalski',
        email: 'jan@example.com',
        address: 'Testowa',
        building: '1',
        number: '10',
        postalCode: '00-001',
        city: 'Warszawa',
        shareNumerator: 1,
        shareDenominator: 10,
        isActive: true,
        homeownersAssociation: {
          id: 'hoa-1',
          externalId: 'HOA-1',
          name: 'Wspólnota Test',
        },
        user: null,
        charges: [],
        chargeNotifications: [
          {
            id: 'notif-1',
            lineNo: 1,
            description: 'Fundusz remontowy',
            quantity: '50.5',
            unit: 'm2',
            unitPrice: '2.5',
            totalAmount: '126.25',
            createdAt: '2026-04-01T00:00:00.000Z',
            updatedAt: '2026-04-01T00:00:00.000Z',
          },
        ],
        payments: [],
      }),
    } as Response);

    render(<ApartmentDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Powiadomienia czynszowe')).toBeInTheDocument();
    });

    expect(screen.getByText('Fundusz remontowy')).toBeInTheDocument();
    expect(screen.getByText('50.5 m2 × 2,50 zł')).toBeInTheDocument();
    expect(screen.getAllByText('126,25 zł')).toHaveLength(2);
    expect(screen.getByText('Razem:')).toBeInTheDocument();
  });

  it('toggles apartment status after confirmation', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'apt-1',
          externalOwnerId: 'W1',
          externalApartmentId: 'A1',
          owner: null,
          email: null,
          address: null,
          building: null,
          number: '10',
          postalCode: null,
          city: null,
          shareNumerator: null,
          shareDenominator: null,
          isActive: true,
          homeownersAssociation: {
            id: 'hoa-1',
            externalId: 'HOA-1',
            name: 'Wspólnota Test',
          },
          user: {
            id: 'user-1',
            name: null,
            email: 'jan@example.com',
          },
          charges: [],
          chargeNotifications: [],
          payments: [],
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    render(<ApartmentDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText(/aktywny/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /dezaktywuj/i }));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dezaktywuj mieszkanie',
          variant: 'destructive',
        })
      );
      expect(fetch).toHaveBeenCalledWith('/api/admin/apartments/apt-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
    });

    expect(screen.getByText(/nieaktywny/i)).toBeInTheDocument();
    expect(screen.getByText(/brak \(brak\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^brak$/i).length).toBeGreaterThan(1);
  });

  it('does not update status when confirmation is rejected', async () => {
    confirmMock.mockResolvedValueOnce(false);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'apt-1',
        externalOwnerId: 'W1',
        externalApartmentId: 'A1',
        owner: 'Jan Kowalski',
        email: 'jan@example.com',
        address: 'Testowa',
        building: '1',
        number: '10',
        postalCode: '00-001',
        city: 'Warszawa',
        shareNumerator: 1,
        shareDenominator: 10,
        isActive: false,
        homeownersAssociation: {
          id: 'hoa-1',
          externalId: 'HOA-1',
          name: 'Wspólnota Test',
        },
        user: null,
        charges: [{ id: 'charge-1' }],
        chargeNotifications: [],
        payments: [{ id: 'payment-1' }],
      }),
    } as Response);

    render(<ApartmentDetailsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /aktywuj/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /aktywuj/i }));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Aktywuj mieszkanie',
          variant: 'default',
        })
      );
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/sekcja wpłat/i)).toBeInTheDocument();
    expect(screen.getByText(/lista naliczeń/i)).toBeInTheDocument();
  });
});
