import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentMonthlyChartCard } from '@/components/payments/payment-monthly-chart-card';

const { mockChart } = vi.hoisted(() => ({ mockChart: vi.fn() }));

vi.mock('@/components/charts/payment-monthly-balance-chart', () => ({
  PaymentMonthlyBalanceChart: (props: unknown) => {
    mockChart(props);
    return <div>wykres</div>;
  },
}));

describe('PaymentMonthlyChartCard', () => {
  it('renders the chart with the given data', () => {
    const data = [{ month: 'Sty', payments: 1, charges: 2, balance: -1 }];

    render(<PaymentMonthlyChartCard data={data as never} />);

    expect(
      screen.getByText('Wykres rozliczeń miesięcznych')
    ).toBeInTheDocument();
    expect(mockChart).toHaveBeenCalledWith({ data });
  });
});
