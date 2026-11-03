import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PaymentsPage from '@/app/dashboard/payments/page';

const pending = vi.hoisted(() => ({ value: false }));

vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => <button type="button">Wstecz</button>,
}));
vi.mock('@/components/payments/payments-overview', () => ({
  PaymentsOverview: () => <Content />,
}));

function Content() {
  if (pending.value) {
    use(new Promise<never>(() => {}));
  }

  return <div>payments-loaded</div>;
}

describe('PaymentsPage', () => {
  it('shows the header and a skeleton while the payments load', () => {
    pending.value = true;

    render(<PaymentsPage />);

    expect(screen.getByRole('heading', { name: 'Wpłaty' })).toBeInTheDocument();
    expect(screen.getByTestId('card-list-skeleton')).toBeInTheDocument();
  });

  it('replaces the skeleton with the payments', () => {
    pending.value = false;

    render(<PaymentsPage />);

    expect(screen.getByText('payments-loaded')).toBeInTheDocument();
    expect(screen.queryByTestId('card-list-skeleton')).not.toBeInTheDocument();
  });
});
