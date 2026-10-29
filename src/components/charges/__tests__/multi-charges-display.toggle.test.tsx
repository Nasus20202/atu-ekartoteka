import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiChargesDisplay } from '@/components/charges/multi-charges-display';

vi.mock('@/components/charges/multi-apartment-period-card', () => ({
  MultiApartmentPeriodCard: ({ period }: { period: string }) => (
    <div>Szczegóły {period}</div>
  ),
}));

const PERIODS = ['202502', '202501', '202412'];

describe('MultiChargesDisplay — expanding', () => {
  it('opens only the most recent month by default', () => {
    render(<MultiChargesDisplay periods={PERIODS} chargesByPeriod={{}} />);

    expect(screen.getByText('Szczegóły 202502')).toBeInTheDocument();
    expect(screen.queryByText('Szczegóły 202501')).not.toBeInTheDocument();
  });

  it('toggles a month', async () => {
    render(<MultiChargesDisplay periods={PERIODS} chargesByPeriod={{}} />);

    await userEvent.click(screen.getByRole('button', { name: /Styczeń 2025/ }));
    expect(screen.getByText('Szczegóły 202501')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Luty 2025/ }));
    expect(screen.queryByText('Szczegóły 202502')).not.toBeInTheDocument();
  });

  it('toggles a year', async () => {
    render(<MultiChargesDisplay periods={PERIODS} chargesByPeriod={{}} />);

    await userEvent.click(screen.getByRole('button', { name: '2025' }));
    expect(
      screen.queryByRole('button', { name: /Luty 2025/ })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '2025' }));
    expect(
      screen.getByRole('button', { name: /Luty 2025/ })
    ).toBeInTheDocument();
  });

  it('hides periods after the charges data date', () => {
    render(
      <MultiChargesDisplay
        periods={PERIODS}
        chargesByPeriod={{}}
        chargesDataDate="2025-01-15T00:00:00.000Z"
      />
    );

    expect(
      screen.queryByRole('button', { name: /Luty 2025/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Styczeń 2025/ })
    ).toBeInTheDocument();
  });
});
