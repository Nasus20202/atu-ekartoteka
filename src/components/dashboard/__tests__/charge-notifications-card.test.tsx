import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChargeNotificationsCard } from '@/components/dashboard/charge-notifications-card';

describe('ChargeNotificationsCard', () => {
  const mockNotifications = [
    {
      id: '1',
      externalId: 'EXT-1',
      description: 'Czynsz',
      quantity: 50.5,
      unit: 'm²',
      unitPrice: 10.0,
      totalAmount: 505.0,
      lineNo: 1,
      apartmentId: 'apt-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      externalId: 'EXT-2',
      description: 'Woda',
      quantity: 15,
      unit: 'm³',
      unitPrice: 5.0,
      totalAmount: 75.0,
      lineNo: 2,
      apartmentId: 'apt-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should render nothing when notifications array is empty', () => {
    const { container } = render(
      <ChargeNotificationsCard notifications={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render card title and description', () => {
    render(<ChargeNotificationsCard notifications={mockNotifications} />);

    expect(screen.getByText('Powiadomienia czynszowe')).toBeInTheDocument();
    expect(screen.getByText(/miesięczne opłaty za/i)).toBeInTheDocument();
  });

  it('should render all notifications', () => {
    render(<ChargeNotificationsCard notifications={mockNotifications} />);

    expect(screen.getByText('Czynsz')).toBeInTheDocument();
    expect(screen.getByText('Woda')).toBeInTheDocument();
  });

  it('should display notification details correctly', () => {
    render(<ChargeNotificationsCard notifications={mockNotifications} />);

    expect(screen.getByText(/50\.5 m² × 10\.00 zł/)).toBeInTheDocument();
    expect(screen.getByText(/15 m³ × 5\.00 zł/)).toBeInTheDocument();
  });

  it('should display notification amounts', () => {
    render(<ChargeNotificationsCard notifications={mockNotifications} />);

    expect(screen.getByText('505.00 zł')).toBeInTheDocument();
    expect(screen.getByText('75.00 zł')).toBeInTheDocument();
  });

  it('should calculate and display total amount', () => {
    render(<ChargeNotificationsCard notifications={mockNotifications} />);

    expect(screen.getByText('Razem do zapłaty:')).toBeInTheDocument();
    expect(screen.getByText('580.00 zł')).toBeInTheDocument();
  });

  it('should handle single notification', () => {
    render(<ChargeNotificationsCard notifications={[mockNotifications[0]]} />);

    expect(screen.getByText('Czynsz')).toBeInTheDocument();
    const amountElements = screen.getAllByText('505.00 zł');
    expect(amountElements.length).toBeGreaterThan(0);
  });

  it('should format amounts with two decimal places', () => {
    const notification = {
      ...mockNotifications[0],
      totalAmount: 123.456,
      unitPrice: 9.999,
    };

    render(<ChargeNotificationsCard notifications={[notification]} />);

    expect(screen.getByText(/10\.00 zł/)).toBeInTheDocument();
    const amountElements = screen.getAllByText('123.46 zł');
    expect(amountElements.length).toBeGreaterThan(0);
  });
});
