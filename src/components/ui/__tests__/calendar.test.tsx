import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Calendar } from '@/components/ui/calendar';

const day = (name: string) => screen.getByRole('button', { name });

describe('Calendar', () => {
  afterEach(() => vi.useRealTimers());

  it('marks today and opens its month without a chosen day', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 10, 12));

    render(<Calendar selected={null} onSelect={vi.fn()} />);

    expect(day('10 czerwca 2026')).toHaveAttribute('aria-current', 'date');
    expect(day('11 czerwca 2026')).not.toHaveAttribute('aria-current');
  });

  it('shows the month of the chosen day in Polish, Monday first', () => {
    render(<Calendar selected="2026-12-31" onSelect={vi.fn()} />);

    expect(screen.getByRole('grid')).toHaveAccessibleName('grudzień 2026');
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('pn');
    expect(day('31 grudnia 2026')).toHaveAttribute('aria-pressed', 'true');
    expect(day('30 listopada 2026')).toBeInTheDocument();
  });

  it('reports the clicked day', async () => {
    const onSelect = vi.fn();
    render(<Calendar selected="2026-12-31" onSelect={onSelect} />);

    await userEvent.click(day('15 grudnia 2026'));

    expect(onSelect).toHaveBeenCalledWith('2026-12-15');
  });

  it('moves between months with an animation', async () => {
    render(<Calendar selected="2026-12-31" onSelect={vi.fn()} />);

    await userEvent.click(day('Następny miesiąc'));

    const grid = screen.getByRole('grid', { name: 'styczeń 2027' });
    expect(grid.closest('.motion-safe\\:animate-view-switch')).not.toBeNull();

    await userEvent.click(day('Poprzedni miesiąc'));
    expect(
      screen.getByRole('grid', { name: 'grudzień 2026' })
    ).toBeInTheDocument();
  });

  it('keeps the focus on the day while the keys cross a month', async () => {
    render(<Calendar selected="2026-12-31" onSelect={vi.fn()} />);
    day('31 grudnia 2026').focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(day('1 stycznia 2027')).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(day('25 grudnia 2026')).toHaveFocus();
  });
});
