import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChargeTrendChart } from '@/components/charts/charge-trend-chart';

describe('ChargeTrendChart', () => {
  const series = [
    { key: 'hoa_hoa_1', label: 'Wspólnota A', color: 'hsl(var(--primary))' },
    {
      key: 'hoa_hoa_2',
      label: 'Wspólnota B',
      color: 'hsl(var(--destructive))',
    },
  ];

  it('renders chart container when HOA series exist', () => {
    render(
      <ChargeTrendChart
        data={[
          {
            period: '202501',
            label: 'Styczeń 2025',
            hoa_hoa_1: 100,
            hoa_hoa_2: 20,
          },
          {
            period: '202502',
            label: 'Luty 2025',
            hoa_hoa_1: 120,
            hoa_hoa_2: 40,
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
          hoa_hoa_1: 100 + index,
          hoa_hoa_2: 50 + index,
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
  });

  it('renders fallback when there are no HOA series', () => {
    render(<ChargeTrendChart data={[]} series={[]} />);

    expect(screen.getByTestId('charge-trend-fallback')).toHaveTextContent(
      'Wykres pojawi się, gdy będą dostępne naliczenia z ostatnich 12 miesięcy.'
    );
  });
});
