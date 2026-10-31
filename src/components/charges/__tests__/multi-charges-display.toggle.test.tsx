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
  it('keeps all months collapsed by default', () => {
    render(<MultiChargesDisplay periods={PERIODS} chargesByPeriod={{}} />);

    expect(screen.queryByText('Szczegóły 202502')).not.toBeInTheDocument();
    expect(screen.queryByText('Szczegóły 202501')).not.toBeInTheDocument();
  });

  it('toggles a month', async () => {
    render(<MultiChargesDisplay periods={PERIODS} chargesByPeriod={{}} />);

    await userEvent.click(screen.getByRole('button', { name: /Styczeń 2025/ }));
    expect(screen.getByText('Szczegóły 202501')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Styczeń 2025/ }));
    expect(screen.queryByText('Szczegóły 202501')).not.toBeInTheDocument();
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

  it('hides periods after the charge cutoff', () => {
    render(
      <MultiChargesDisplay
        periods={PERIODS}
        chargesByPeriod={{}}
        cutoffPeriod="202501"
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
