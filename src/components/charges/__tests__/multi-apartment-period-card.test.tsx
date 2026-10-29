import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiApartmentPeriodCard } from '@/components/charges/multi-apartment-period-card';
import type { ChargeDisplayDto } from '@/lib/types/dto/charge-dto';
import { formatCurrency } from '@/lib/utils';

vi.mock('@/components/pdf/download-charges-pdf-button', () => ({
  DownloadChargesPdfButton: ({
    apartmentLabel,
    charges,
  }: {
    apartmentLabel: string;
    charges: unknown[];
  }) => (
    <button>
      PDF {apartmentLabel} ({charges.length})
    </button>
  ),
}));

function makeCharge(id: string, totalAmount: string): ChargeDisplayDto {
  return {
    id,
    description: `Opłata ${id}`,
    quantity: '1',
    unit: 'szt',
    unitPrice: totalAmount,
    totalAmount,
    dateFrom: '2024-11-01T00:00:00.000Z',
    dateTo: '2024-11-30T00:00:00.000Z',
  };
}

const APARTMENTS = [
  {
    apartmentNumber: '1',
    apartmentAddress: 'ul. Testowa 1/1',
    hoaName: 'Wspólnota A',
    charges: [makeCharge('a1', '100'), makeCharge('a2', '20')],
  },
  {
    apartmentNumber: '2',
    apartmentAddress: 'ul. Krótka 2/2',
    hoaName: 'Wspólnota B',
    charges: [makeCharge('b1', '45')],
  },
];

describe('MultiApartmentPeriodCard', () => {
  it('shows each apartment with its total, charges and PDF button', () => {
    render(
      <MultiApartmentPeriodCard period="202411" apartmentsData={APARTMENTS} />
    );

    expect(screen.getByText(/^Okres/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'ul. Testowa 1/1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^ul\. Testowa 1\/1/ }).textContent
    ).toContain(formatCurrency(120));
    expect(
      screen.getByRole('button', { name: /^ul\. Krótka 2\/2/ }).textContent
    ).toContain(formatCurrency(45));
    expect(
      screen.getByRole('button', { name: 'PDF ul. Testowa 1/1 (2)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'PDF ul. Krótka 2/2 (1)' })
    ).toBeInTheDocument();
    expect(screen.getByText('Opłata a2')).toBeInTheDocument();
    expect(screen.getByText('Opłata b1')).toBeInTheDocument();
  });

  it('collapses the charges of one apartment', async () => {
    render(
      <MultiApartmentPeriodCard period="202411" apartmentsData={APARTMENTS} />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /^ul\. Testowa 1\/1/ })
    );

    expect(screen.queryByText('Opłata a1')).not.toBeInTheDocument();
    expect(screen.getByText('Opłata b1')).toBeInTheDocument();
  });
});
