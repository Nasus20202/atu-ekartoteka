import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChargesDisplay } from '@/components/charges/charges-display';
import type { ChargeDisplayDto } from '@/lib/types/dto/charge-dto';

vi.mock('@/components/pdf/download-charges-pdf-button', () => ({
  DownloadChargesPdfButton: () => <button>Pobierz PDF</button>,
}));

const SCROLL_DELAY_MS = 300;

const charge = (id: string): ChargeDisplayDto => ({
  id,
  description: `Opłata ${id}`,
  quantity: '1',
  unit: 'szt',
  unitPrice: '10',
  totalAmount: '10',
  dateFrom: '2025-01-01T00:00:00.000Z',
  dateTo: '2025-01-31T00:00:00.000Z',
});

const props = {
  periods: ['202502', '202501'],
  chargesByPeriod: {
    '202502': [charge('feb')],
    '202501': [charge('jan')],
  },
  activeMonth: null,
  apartmentLabel: 'A/101',
  hoaName: 'Wspólnota',
};

describe('ChargesDisplay interactions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses and reopens a year', async () => {
    render(<ChargesDisplay {...props} />);
    const year = screen.getByRole('button', { name: /^2025$/ });

    await userEvent.click(year);
    expect(year).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(year);
    expect(year).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens a collapsed month and closes it again', async () => {
    render(<ChargesDisplay {...props} />);
    const january = screen.getByRole('button', { name: /styczeń/i });

    expect(january).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(january);
    expect(screen.getByText('Opłata jan')).toBeInTheDocument();

    await userEvent.click(january);
    expect(january).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides periods after the charges data date', () => {
    render(
      <ChargesDisplay {...props} chargesDataDate="2025-01-31T00:00:00.000Z" />
    );

    expect(
      screen.queryByRole('button', { name: /luty/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /styczeń/i })
    ).toBeInTheDocument();
  });

  it('scrolls the active month into view after the animation', () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<ChargesDisplay {...props} activeMonth="202501" />);
    expect(scrollIntoView).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(SCROLL_DELAY_MS);
    });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });
});
