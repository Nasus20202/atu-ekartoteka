import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BalanceHistoryChart } from '@/components/charts/balance-history-chart';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const history = (length: number) =>
  Array.from({ length }, (_, index) => ({
    period: `2024${String(index + 1).padStart(2, '0')}`,
    label: `Miesiąc ${index + 1}`,
    apt_0: index % 2 === 0 ? 100 : -50,
  }));

const singleSeries = [
  {
    key: 'apt_0' as const,
    label: 'Testowa 1/1',
    color: 'blue',
    apartmentId: 'apt-1',
  },
];

describe('BalanceHistoryChart', () => {
  it('renders nothing without data', () => {
    const { container } = render(<BalanceHistoryChart data={[]} series={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders chart container when balance history exists', () => {
    render(<BalanceHistoryChart data={history(2)} series={singleSeries} />);

    expect(screen.getByTestId('balance-history-chart')).toBeInTheDocument();
    expect(
      screen.getByText('Pokazano Miesiąc 1 - Miesiąc 2')
    ).toBeInTheDocument();
  });

  it('allows moving through history when more than 12 months are available', () => {
    render(<BalanceHistoryChart data={history(13)} series={singleSeries} />);

    expect(
      screen.getByText('Pokazano Miesiąc 2 - Miesiąc 13')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pokaż wcześniejsze miesiące' })
    );

    expect(
      screen.getByText('Pokazano Miesiąc 1 - Miesiąc 12')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Pokaż wcześniejsze miesiące' })
    ).toBeDisabled();
  });
});
