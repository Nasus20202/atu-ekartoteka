import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { YEAR_START_ATTRIBUTE } from '@/components/import/use-year-balance-scroll';
import { YearBalanceScroll } from '@/components/import/year-balance-scroll';

const STICKY_WIDTH = 100;
const VIEWPORT_WIDTH = 500;
const CONTENT_WIDTH = 900;
// Year columns start 200px apart, the first one right after the sticky column
const YEAR_LEFTS = [STICKY_WIDTH, 300, 500];

const scrollTo = vi.fn();

const originalMatchMedia = window.matchMedia;

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

function rect(left: number, width = 0): DOMRect {
  return new DOMRect(left, 0, width, 0);
}

function mockRect(element: Element, getRect: () => DOMRect) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: getRect,
    configurable: true,
  });
}

function setup(scrollLeft = 0) {
  const view = render(
    <YearBalanceScroll>
      <table data-testid="table">
        <thead>
          <tr>
            <th>Wspólnota</th>
            {[2024, 2025, 2026].map((year) => (
              <th key={year} {...{ [YEAR_START_ATTRIBUTE]: year }}>
                {year}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </YearBalanceScroll>
  );
  const scroller = screen.getByTestId('table').parentElement as HTMLElement;
  const define = (name: string, value: number) =>
    Object.defineProperty(scroller, name, { value, configurable: true });
  define('clientWidth', VIEWPORT_WIDTH);
  define('scrollWidth', CONTENT_WIDTH);
  mockRect(scroller, () => rect(0, VIEWPORT_WIDTH));
  mockRect(scroller.querySelector('thead th')!, () => rect(0, STICKY_WIDTH));
  scroller.querySelectorAll(`[${YEAR_START_ATTRIBUTE}]`).forEach((cell, i) => {
    // The cells are drawn scrolled, like in a real browser
    mockRect(cell, () => rect(YEAR_LEFTS[i] - scrollLeft, 200));
  });
  // The component measured the table before the geometry above existed
  fireEvent.scroll(scroller);
  return { ...view, scroller };
}

function scrollTo_(scroller: HTMLElement, left: number) {
  Object.defineProperty(scroller, 'scrollLeft', {
    value: left,
    configurable: true,
  });
  fireEvent.scroll(scroller);
}

describe('YearBalanceScroll', () => {
  beforeEach(() => {
    scrollTo.mockReset();
    Element.prototype.scrollTo =
      scrollTo as unknown as typeof Element.prototype.scrollTo;
    mockReducedMotion(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders its content between two year buttons', () => {
    setup();

    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Poprzedni rok' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Następny rok' })).toBeVisible();
  });

  it('cannot go back from the first year', () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'Poprzedni rok' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Następny rok' })).toBeEnabled();
  });

  it('scrolls to the next year, leaving the first column visible', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Następny rok' }));

    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });

  it('scrolls to the previous year', async () => {
    const { scroller } = setup(200);
    scrollTo_(scroller, 200);

    await userEvent.click(
      screen.getByRole('button', { name: 'Poprzedni rok' })
    );

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'smooth' });
  });

  it('moves on to the following year from the middle of the table', async () => {
    const { scroller } = setup(200);
    scrollTo_(scroller, 200);

    await userEvent.click(screen.getByRole('button', { name: 'Następny rok' }));

    expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: 'smooth' });
  });

  it('disables the next button at the end of the table', () => {
    const { scroller } = setup(200);
    scrollTo_(scroller, CONTENT_WIDTH - VIEWPORT_WIDTH);

    expect(screen.getByRole('button', { name: 'Następny rok' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Poprzedni rok' })).toBeEnabled();
  });

  it('does not animate when the user prefers reduced motion', async () => {
    mockReducedMotion(true);
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Następny rok' }));

    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'auto' });
  });

  it('does not scroll when there is no further year', async () => {
    const { scroller } = setup(400);
    scrollTo_(scroller, 400);

    await userEvent.click(screen.getByRole('button', { name: 'Następny rok' }));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('opens scrolled to the right, on the newest year', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => CONTENT_WIDTH,
    });
    try {
      render(
        <YearBalanceScroll>
          <table data-testid="table" />
        </YearBalanceScroll>
      );

      const scroller = screen.getByTestId('table').parentElement!;
      expect(scroller.scrollLeft).toBe(CONTENT_WIDTH);
      expect(scroller).toHaveAttribute('data-scrolled', 'true');
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
    }
  });

  it('marks the table as scrolled only while it is not at the start', () => {
    const { scroller } = setup();
    expect(scroller).toHaveAttribute('data-scrolled', 'false');

    scrollTo_(scroller, 200);
    expect(scroller).toHaveAttribute('data-scrolled', 'true');

    scrollTo_(scroller, 0);
    expect(scroller).toHaveAttribute('data-scrolled', 'false');
  });
});
