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
        makeCharge('a', '202410', '50'),
        makeCharge('b', '202411', '100'),
        makeCharge('c', '202411', '25'),
      ]}
    />
  );
}

describe('AdminChargesList', () => {
  it('lists months newest first with their totals', () => {
    renderList();

    const months = screen.getAllByRole('button', { name: /2024/ });
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
});
