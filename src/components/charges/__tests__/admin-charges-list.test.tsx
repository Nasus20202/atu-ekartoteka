import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdminChargesList } from '@/components/charges/admin-charges-list';
import type { ChargePeriodItemDto } from '@/lib/types/dto/charge-dto';
import { formatCurrency } from '@/lib/utils';

vi.mock('@/components/pdf/download-charges-pdf-button', () => ({
  DownloadChargesPdfButton: ({ period }: { period: string }) => (
    <button>PDF {period}</button>
  ),
}));

function makeCharge(
  id: string,
  period: string,
  totalAmount: string
): ChargePeriodItemDto {
  return {
    id,
    description: `Opłata ${id}`,
    quantity: '1',
    unit: 'szt',
    unitPrice: totalAmount,
    totalAmount,
    dateFrom: '2024-11-01T00:00:00.000Z',
    dateTo: '2024-11-30T00:00:00.000Z',
    period,
  };
}

function renderList() {
  return render(
    <AdminChargesList
      apartmentLabel="A-1"
      hoaName="Wspólnota"
      charges={[
        makeCharge('b', '202411', '100'),
        makeCharge('c', '202411', '25'),
        makeCharge('a', '202410', '50'),
        makeCharge('d', '202312', '80'),
      ]}
    />
  );
}

describe('AdminChargesList', () => {
  it('groups months into year sections, newest year first', () => {
    renderList();

    const years = screen.getAllByRole('button', { name: /^\d{4}$/ });
    expect(years.map((y) => y.textContent)).toEqual(['2024', '2023']);
  });

  it('opens only the newest year, listing its months newest first', () => {
    renderList();

    const months = screen.getAllByRole('button', { name: /\S+ 20\d\d/ });
    expect(months.map((m) => m.textContent)).toEqual([
      `Listopad 2024${formatCurrency(125)}`,
      `Październik 2024${formatCurrency(50)}`,
    ]);
  });

  it('keeps months collapsed until opened', async () => {
    renderList();

    expect(screen.queryByText('Opłata b')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Listopad 2024/ })
    );

    expect(screen.getByText('Opłata b')).toBeInTheDocument();
    expect(screen.getByText('Opłata c')).toBeInTheDocument();
    expect(screen.getByText(/^Okres/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'PDF 202411' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Opłata a')).not.toBeInTheDocument();
  });

  it('keeps older years collapsed until opened', async () => {
    renderList();

    expect(
      screen.queryByRole('button', { name: /Grudzień 2023/ })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '2023' }));

    expect(
      screen.getByRole('button', { name: /Grudzień 2023/ })
    ).toBeInTheDocument();
  });
});
