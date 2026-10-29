import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentYearRow } from '@/components/payments/payment-year-row';
import {
  PAYMENT_AMOUNT_FIELD_KEYS,
  type PaymentListItemDto,
} from '@/lib/types/dto/payment-dto';
import { formatCurrency } from '@/lib/utils';

const exactText = (value: string) => (_: string, element: Element | null) =>
  element?.textContent === value && element.children.length === 0;

vi.mock('@/components/pdf/download-payment-pdf-button', () => ({
  DownloadPaymentPdfButton: () => <button>PDF</button>,
}));

function makePayment(closingBalance: string): PaymentListItemDto {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: '2024-01-01T00:00:00.000Z',
    dateTo: '2024-12-31T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...Object.fromEntries(PAYMENT_AMOUNT_FIELD_KEYS.map((key) => [key, '0'])),
    closingBalance,
  } as PaymentListItemDto;
}

function renderRow(closingBalance: string) {
  return render(
    <PaymentYearRow
      apartmentId="apt-1"
      apartmentLabel="A-1"
      hoaName="Wspólnota"
      payment={makePayment(closingBalance)}
      dateFromLabel="01.01.2024"
      dateToLabel="31.12.2024"
    />
  );
}

describe('PaymentYearRow', () => {
  it('links to the year details with its range and balance', () => {
    renderRow('15');

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/payments/apt-1/2024'
    );
    expect(screen.getByText('Rok 2024')).toBeInTheDocument();
    expect(screen.getByText('01.01.2024 - 31.12.2024')).toBeInTheDocument();
    expect(screen.getByText(exactText(formatCurrency(15)))).toHaveClass(
      'text-green-600'
    );
  });

  it('marks a negative balance in red', () => {
    renderRow('-15');

    expect(screen.getByText(exactText(formatCurrency(-15)))).toHaveClass(
      'text-red-600'
    );
  });

  it('does not follow the link when the PDF button is clicked', () => {
    renderRow('0');

    const click = fireEvent.click(screen.getByRole('button', { name: 'PDF' }));

    expect(click).toBe(false);
  });
});
