import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApartmentDetailsContent } from '@/components/apartments/apartment-details-content';
import type { ApartmentDetailDto } from '@/lib/types/dto/apartment-dto';

const confirmMock = vi.fn();
const actionMock = vi.hoisted(() => ({ setApartmentActiveAction: vi.fn() }));

vi.mock('@/actions/apartments/apartments', () => actionMock);

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

vi.mock('@/components/charges/admin-charges-list', () => ({
  AdminChargesList: () => <div>Lista naliczeń</div>,
}));

vi.mock('@/components/payments/apartment-payments-section', () => ({
  ApartmentPaymentsSection: () => <div>Sekcja wpłat</div>,
}));

global.fetch = vi.fn();

const baseApartment = {
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
  shareRatio: 0.1,
  isActive: true,
  homeownersAssociation: {
    id: 'hoa-1',
    externalId: 'HOA-1',
    name: 'Wspólnota Test',
  },
  user: null,
  charges: [],
  chargeNotifications: [],
  payments: [],
};

function renderContent(overrides: Record<string, unknown> = {}) {
  render(
    <ApartmentDetailsContent
      apartmentId="apt-1"
      initialApartment={
        { ...baseApartment, ...overrides } as unknown as ApartmentDetailDto
      }
    />
  );
}

describe('ApartmentDetailsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock.mockResolvedValue(true);
  });

  it('renders stringified notification dto values from the server', () => {
    renderContent({
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
    });

    expect(screen.getByText('Powiadomienia czynszowe')).toBeInTheDocument();
    expect(screen.getByText('Fundusz remontowy')).toBeInTheDocument();
    expect(screen.getByText('50,5 m2 × 2,50 zł')).toBeInTheDocument();
    expect(screen.getAllByText('126,25 zł')).toHaveLength(2);
    expect(screen.getByText('Razem:')).toBeInTheDocument();
  });

  it('toggles apartment status after confirmation', async () => {
    actionMock.setApartmentActiveAction.mockResolvedValueOnce({
      ok: true,
      data: { id: 'apt-1', isActive: false },
    });
    renderContent({
      owner: null,
      email: null,
      address: null,
      building: null,
      postalCode: null,
      city: null,
      shareRatio: null,
      user: { id: 'user-1', name: null, email: 'jan@example.com' },
    });

    expect(screen.getByText(/aktywny/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /dezaktywuj/i }));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dezaktywuj mieszkanie',
          variant: 'destructive',
        })
      );
      expect(actionMock.setApartmentActiveAction).toHaveBeenCalledWith(
        'apt-1',
        false
      );
    });

    expect(await screen.findByText(/nieaktywny/i)).toBeInTheDocument();
    expect(screen.getByText(/brak \(brak\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^brak$/i).length).toBeGreaterThan(1);
  });

  it('does not update status when confirmation is rejected', async () => {
    confirmMock.mockResolvedValueOnce(false);
    renderContent({
      isActive: false,
      charges: [{ id: 'charge-1' }],
      payments: [{ id: 'payment-1' }],
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

    expect(actionMock.setApartmentActiveAction).not.toHaveBeenCalled();
    expect(screen.getByText(/sekcja wpłat/i)).toBeInTheDocument();
    expect(screen.getByText(/lista naliczeń/i)).toBeInTheDocument();
  });
});
