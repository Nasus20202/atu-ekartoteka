import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaymentMonthlyBalanceChart } from '@/components/charts/payment-monthly-balance-chart';

describe('PaymentMonthlyBalanceChart', () => {
  it('renders chart container when data exists', () => {
    render(
      <PaymentMonthlyBalanceChart
        data={[
          {
            monthIndex: 0,
            label: 'Styczeń',
            payments: 100,
            charges: 50,
            balance: 50,
          },
          {
            monthIndex: 1,
            label: 'Luty',
            payments: 80,
            charges: 90,
            balance: 40,
          },
        ]}
      />
    );

    expect(screen.getByTestId('payment-monthly-chart')).toBeInTheDocument();
  });

  it('renders fallback when no data exists', () => {
    render(<PaymentMonthlyBalanceChart data={[]} />);

    expect(
      screen.getByTestId('payment-monthly-chart-fallback')
    ).toHaveTextContent('Brak miesięcznych danych do pokazania na wykresie.');
  });
});
