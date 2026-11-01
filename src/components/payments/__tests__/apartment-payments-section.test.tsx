import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import { ApartmentPaymentsSection } from '@/components/payments/apartment-payments-section';
import { Prisma } from '@/generated/prisma/browser';

vi.mock('@/components/payments/admin-payments-list', () => ({
  AdminPaymentsList: () => <div>Lista wpłat</div>,
}));

describe('ApartmentPaymentsSection', () => {
  it('renders payment history list without a yearly trend block', () => {
    render(
      <ApartmentPaymentsSection
        payments={[
          createMockPayment({
            year: 2024,
            calculatedClosingBalance: new Prisma.Decimal(-100),
          }),
          createMockPayment({
            id: 'pay-2',
            year: 2025,
            calculatedClosingBalance: new Prisma.Decimal(50),
          }),
        ]}
        apartmentId="apt-1"
        apartmentLabel="Test 1/1"
        hoaName="Test HOA"
      />
    );

    expect(screen.getByText('Lista wpłat')).toBeInTheDocument();
  });
});
