import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaymentYearSelect } from '@/components/payments/payment-year-select';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('PaymentYearSelect', () => {
  it('shows the current year', () => {
    render(
      <PaymentYearSelect apartmentId="apt-1" year={2025} years={[2025, 2024]} />
    );

    expect(screen.getByRole('button', { name: 'Rok' })).toHaveTextContent(
      'Rok 2025'
    );
  });

  it('navigates to the chosen payment year', async () => {
    render(
      <PaymentYearSelect apartmentId="apt-1" year={2025} years={[2025, 2024]} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Rok' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Rok 2024' })
    );

    expect(mockPush).toHaveBeenCalledWith('/dashboard/payments/apt-1/2024');
  });
});
