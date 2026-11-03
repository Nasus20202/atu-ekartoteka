import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ApartmentChargesLoading from '@/app/dashboard/charges/[apartmentId]/loading';
import ChargesLoading from '@/app/dashboard/charges/loading';
import PaymentDetailsLoading from '@/app/dashboard/payments/[apartmentId]/[year]/loading';
import PaymentsLoading from '@/app/dashboard/payments/loading';
import ProfileLoading from '@/app/dashboard/profile/loading';

vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => null,
}));

describe('tenant route loading states', () => {
  it.each([
    ['charges', ChargesLoading, 'Naliczenia'],
    ['payments', PaymentsLoading, 'Wpłaty'],
    ['profile', ProfileLoading, 'Profil'],
  ])('%s shows its heading with a skeleton', (_name, Loading, heading) => {
    const { container } = render(<Loading />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it.each([
    ['apartment charges', ApartmentChargesLoading],
    ['payment details', PaymentDetailsLoading],
  ])('%s shows only skeletons', (_name, Loading) => {
    const { container } = render(<Loading />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
