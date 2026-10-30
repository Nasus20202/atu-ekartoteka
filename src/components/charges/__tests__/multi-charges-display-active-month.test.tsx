import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MultiChargesDisplay } from '@/components/charges/multi-charges-display';
import { ACTIVE_MONTH_SCROLL_DELAY_MS } from '@/components/charges/use-scroll-to-active-month';

vi.mock('@/components/charges/multi-apartment-period-card', () => ({
  MultiApartmentPeriodCard: ({ period }: { period: string }) => (
    <div data-testid={`period-card-${period}`} />
  ),
}));

const periods = ['202502', '202501'];

describe('MultiChargesDisplay active month', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps all months collapsed by default', () => {
    render(<MultiChargesDisplay periods={periods} chargesByPeriod={{}} />);

    expect(screen.queryByTestId('period-card-202502')).not.toBeInTheDocument();
    expect(screen.queryByTestId('period-card-202501')).not.toBeInTheDocument();
  });

  it('opens the requested month', () => {
    render(
      <MultiChargesDisplay
        periods={periods}
        chargesByPeriod={{}}
        activeMonth="202501"
      />
    );

    expect(screen.getByTestId('period-card-202501')).toBeInTheDocument();
    expect(screen.queryByTestId('period-card-202502')).not.toBeInTheDocument();
  });

  it('scrolls the requested month to the top after the animation', () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(
      <MultiChargesDisplay
        periods={periods}
        chargesByPeriod={{}}
        activeMonth="202501"
      />
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(ACTIVE_MONTH_SCROLL_DELAY_MS);
    });

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('does not scroll without a requested month', () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<MultiChargesDisplay periods={periods} chargesByPeriod={{}} />);
    act(() => {
      vi.advanceTimersByTime(ACTIVE_MONTH_SCROLL_DELAY_MS);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
