import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DESKTOP_WIDTH,
  PHONE_WIDTH,
  setViewportWidth,
} from '@/components/import/__tests__/viewport';
import { DatabaseStatsCard } from '@/components/import/database-stats-card';
import type { AssociationStatsState } from '@/components/import/types';
import type { DatabaseStatsDto } from '@/lib/admin/dto/database-stats-dto';

const EMPTY = {
  count: 0,
  rangeFrom: null,
  rangeTo: null,
  lastChangedAt: null,
};

const STATS: DatabaseStatsDto = {
  hoa: { count: 2, rangeFrom: null, rangeTo: null, lastChangedAt: null },
  apartments: {
    count: 6,
    active: 5,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: null,
  },
  users: { ...EMPTY, count: 12345 },
  charges: {
    count: 40,
    rangeFrom: '2025-01-01T00:00:00.000Z',
    rangeTo: '2025-12-01T00:00:00.000Z',
    lastChangedAt: null,
  },
  notifications: EMPTY,
  payments: EMPTY,
  utilitySettlements: EMPTY,
  meterReadings: EMPTY,
  annualSettlements: EMPTY,
};

const NOT_REQUESTED: AssociationStatsState = {
  items: null,
  loading: false,
  failed: false,
  request: () => {},
};

const SUMMARY_HEADER = 'Ostatnia zmiana';
const TOGGLE_NAME = 'Według wspólnot';

type CardProps = ComponentProps<typeof DatabaseStatsCard>;

function renderCard(overrides: Partial<CardProps> = {}) {
  return render(
    <DatabaseStatsCard
      associations={NOT_REQUESTED}
      statsLoading={false}
      dbStats={STATS}
      {...overrides}
    />
  );
}

/** The animated wrapper that holds the given element, or null. */
function animatedWrapper(element: HTMLElement) {
  return element.closest('[class*="animate-view-switch"]');
}

describe('DatabaseStatsCard', () => {
  beforeEach(() => {
    setViewportWidth(DESKTOP_WIDTH);
  });

  it('renders a skeleton while loading', () => {
    renderCard({ dbStats: null, statsLoading: true });

    expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
  });

  it('renders one row per data type with its count, range and last change', () => {
    renderCard();

    expect(screen.getByText(/stan bazy danych/i)).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: SUMMARY_HEADER })
    ).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1, 10);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[0].textContent)
    ).toEqual([
      'Wspólnoty',
      'Mieszkania',
      'Użytkownicy',
      'Naliczenia',
      'Powiadomienia',
      'Wpłaty',
      'Rozliczenia mediów',
      'Odczyty liczników',
      'Koszty rzeczywiste',
    ]);
    expect(screen.getByText('aktywne: 5')).toBeInTheDocument();
    expect(screen.getByText('01.2025 – 12.2025')).toBeInTheDocument();
  });

  it('groups counts of five digits and more with Polish spacing', () => {
    renderCard();

    expect(screen.getByText(/^12\s345$/)).toBeInTheDocument();
  });

  it('shows the summary as a table only on wide screens', () => {
    renderCard();

    expect(
      screen.getByRole('columnheader', { name: 'Dane' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Zakres', { selector: 'dt' })).toBeNull();
  });

  it('animates the summary table in when the stats replace the skeleton', () => {
    renderCard();

    const table = screen.getByRole('columnheader', { name: 'Dane' });
    expect(table.closest('[class*="animate-fade-in"]')).not.toBeNull();
    expect(animatedWrapper(table)).not.toBeNull();
  });

  it('shows each summary row as a stacked card on a phone', () => {
    setViewportWidth(PHONE_WIDTH);
    renderCard();

    expect(screen.queryByRole('columnheader', { name: 'Dane' })).toBeNull();
    const charges = screen.getByText('Naliczenia', { selector: 'p' });
    const card = charges.closest('li')!;
    expect(within(card).getByText('40')).toBeInTheDocument();
    expect(within(card).getByText('01.2025 – 12.2025')).toBeInTheDocument();
    expect(within(card).getByText('Zakres')).toBeInTheDocument();
    expect(within(card).getByText(SUMMARY_HEADER)).toBeInTheDocument();
    expect(animatedWrapper(charges)).not.toBeNull();
  });

  it('renders error state when stats are unavailable', () => {
    renderCard({ dbStats: null });

    expect(
      screen.getByText(/nie udało się pobrać statystyk/i)
    ).toBeInTheDocument();
  });

  it('keeps the per-association section closed and requests its rows when opened', () => {
    const request = vi.fn();
    renderCard({ associations: { ...NOT_REQUESTED, request } });

    const toggle = screen.getByRole('button', { name: TOGGLE_NAME });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(request).not.toHaveBeenCalled();

    fireEvent.click(toggle);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('passes the loaded associations to the section', () => {
    renderCard({ associations: { ...NOT_REQUESTED, items: [] } });

    fireEvent.click(screen.getByRole('button', { name: TOGGLE_NAME }));

    expect(screen.getByText('Brak wspólnot')).toBeInTheDocument();
  });

  it('keeps the summary on screen when the associations fail to load', () => {
    renderCard({ associations: { ...NOT_REQUESTED, failed: true } });

    fireEvent.click(screen.getByRole('button', { name: TOGGLE_NAME }));

    expect(
      screen.getByRole('columnheader', { name: 'Dane' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nie udało się pobrać statystyk wspólnot')
    ).toBeInTheDocument();
  });
});
