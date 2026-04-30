import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApartmentPaymentsSection } from '@/components/payments/apartment-payments-section';
import { Prisma } from '@/generated/prisma/browser';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';

vi.mock('@/components/payments/admin-payments-list', () => ({
  AdminPaymentsList: () => <div>Lista wpłat</div>,
}));

function makePayment(
  overrides: Partial<PaymentDtoSource> = {}
): PaymentDtoSource {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: new Prisma.Decimal(0),
    closingBalance: new Prisma.Decimal(0),
    openingDebt: new Prisma.Decimal(0),
    openingSurplus: new Prisma.Decimal(0),
    januaryPayments: new Prisma.Decimal(0),
    februaryPayments: new Prisma.Decimal(0),
    marchPayments: new Prisma.Decimal(0),
    aprilPayments: new Prisma.Decimal(0),
    mayPayments: new Prisma.Decimal(0),
    junePayments: new Prisma.Decimal(0),
    julyPayments: new Prisma.Decimal(0),
    augustPayments: new Prisma.Decimal(0),
    septemberPayments: new Prisma.Decimal(0),
    octoberPayments: new Prisma.Decimal(0),
    novemberPayments: new Prisma.Decimal(0),
    decemberPayments: new Prisma.Decimal(0),
    januaryCharges: new Prisma.Decimal(0),
    februaryCharges: new Prisma.Decimal(0),
    marchCharges: new Prisma.Decimal(0),
    aprilCharges: new Prisma.Decimal(0),
    mayCharges: new Prisma.Decimal(0),
    juneCharges: new Prisma.Decimal(0),
    julyCharges: new Prisma.Decimal(0),
    augustCharges: new Prisma.Decimal(0),
    septemberCharges: new Prisma.Decimal(0),
    octoberCharges: new Prisma.Decimal(0),
    novemberCharges: new Prisma.Decimal(0),
    decemberCharges: new Prisma.Decimal(0),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('ApartmentPaymentsSection', () => {
  it('renders payment history list without a yearly trend block', () => {
    render(
      <ApartmentPaymentsSection
        payments={[
          makePayment({ year: 2024, closingBalance: new Prisma.Decimal(-100) }),
          makePayment({
            id: 'pay-2',
            year: 2025,
            closingBalance: new Prisma.Decimal(50),
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
