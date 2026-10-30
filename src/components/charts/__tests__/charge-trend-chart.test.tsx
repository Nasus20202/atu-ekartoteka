import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChargeTrendChart } from '@/components/charts/charge-trend-chart';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('ChargeTrendChart', () => {
  const series = [
    {
      key: 'apt_apt_1',
      label: 'Testowa 1/1',
      color: 'hsl(var(--primary))',
      apartmentId: 'apt-1',
    },
    {
      key: 'apt_apt_2',
      label: 'Testowa 1/2',
      color: 'hsl(var(--destructive))',
      apartmentId: 'apt-2',
    },
  ];

  it('renders chart container when HOA series exist', () => {
    render(
      <ChargeTrendChart
        data={[
          {
            period: '202501',
            label: 'Styczeń 2025',
            apt_apt_1: 100,
            apt_apt_2: 20,
          },
          {
            period: '202502',
            label: 'Luty 2025',
            apt_apt_1: 120,
            apt_apt_2: 40,
          },
        ]}
        series={series}
      />
    );

    expect(screen.getByTestId('charge-trend-chart')).toBeInTheDocument();
  });

  it('allows moving through history when more than 12 months are available', () => {
    render(
      <ChargeTrendChart
        data={Array.from({ length: 13 }, (_, index) => ({
          period: `2024${String(index + 1).padStart(2, '0')}`,
          label: `Miesiąc ${index + 1}`,
          apt_apt_1: 100 + index,
          apt_apt_2: 50 + index,
        }))}
        series={series}
      />
    );

    expect(
      screen.getByText('Pokazano Miesiąc 2 - Miesiąc 13')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pokaż wcześniejsze miesiące' })
    );

    expect(
      screen.getByText('Pokazano Miesiąc 1 - Miesiąc 12')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pokaż nowsze miesiące' })
    );

    expect(
      screen.getByText('Pokazano Miesiąc 2 - Miesiąc 13')
    ).toBeInTheDocument();
  });

  it('renders fallback when there are no HOA series', () => {
    render(<ChargeTrendChart data={[]} series={[]} />);

    expect(screen.getByTestId('charge-trend-fallback')).toHaveTextContent(
      'Wykres pojawi się, gdy będą dostępne naliczenia z ostatnich 12 miesięcy.'
    );
  });
});
