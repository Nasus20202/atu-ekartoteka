import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DESKTOP_WIDTH,
  PHONE_WIDTH,
  setViewportWidth,
} from '@/components/import/__tests__/viewport';
import { AssociationStatsSection } from '@/components/import/association-stats-section';
import type { AssociationStatsState } from '@/components/import/types';
import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';

const ASSOCIATIONS: AssociationStatsDto[] = [
  {
    id: 'hoa-1',
    name: 'Alfa',
    apartments: 1234,
    charges: 24,
    notifications: 0,
    payments: 2,
    utilitySettlements: 0,
    annualSettlements: 0,
    lastChargePeriod: '2025-12-01T00:00:00.000Z',
    apartmentsDataDate: '2025-01-15T00:00:00.000Z',
    chargesDataDate: null,
    notificationsDataDate: null,
  },
];

const TOGGLE_NAME = 'Według wspólnot';
const LAST_PERIOD_HEADER = 'Ostatni okres';
const ERROR_MESSAGE = 'Nie udało się pobrać statystyk wspólnot';

function stateWith(
  overrides: Partial<AssociationStatsState>
): AssociationStatsState {
  return {
    items: null,
    loading: false,
    failed: false,
    request: vi.fn(),
    ...overrides,
  };
}

function associationsTable() {
  return screen
    .getByRole('columnheader', { name: LAST_PERIOD_HEADER })
    .closest('table')!;
}

/** The animated wrapper that holds the given element, or null. */
function animatedWrapper(element: HTMLElement) {
  return element.closest('[class*="animate-view-switch"]');
}

function openSection() {
  fireEvent.click(screen.getByRole('button', { name: TOGGLE_NAME }));
}

describe('AssociationStatsSection', () => {
  beforeEach(() => {
    setViewportWidth(DESKTOP_WIDTH);
  });

  it('stays closed and requests nothing until it is opened', () => {
    const request = vi.fn();
    render(
      <AssociationStatsSection
        associations={stateWith({ items: ASSOCIATIONS, request })}
      />
    );

    expect(screen.getByRole('button', { name: TOGGLE_NAME })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('Alfa')).toBeNull();
    expect(request).not.toHaveBeenCalled();

    openSection();

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('shows a skeleton while the associations load', () => {
    render(
      <AssociationStatsSection associations={stateWith({ loading: true })} />
    );

    openSection();

    expect(screen.getByTestId('associations-skeleton')).toBeInTheDocument();
  });

  it('shows a Polish error message when the associations fail to load', () => {
    render(
      <AssociationStatsSection associations={stateWith({ failed: true })} />
    );

    openSection();

    expect(screen.getByText(ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('shows the associations once they are loaded', () => {
    render(
      <AssociationStatsSection
        associations={stateWith({ items: ASSOCIATIONS })}
      />
    );

    openSection();

    expect(screen.getByText('Alfa')).toBeInTheDocument();
    expect(
      within(associationsTable()).getAllByRole('cell')[1].textContent
    ).toBe('1234');
    expect(screen.getByText('Mieszkania: 15.01.2025')).toBeInTheDocument();
    expect(screen.getByText('Naliczenia: —')).toBeInTheDocument();
  });

  it('shows one shared data date when the three dates match', () => {
    const sameDate = {
      ...ASSOCIATIONS[0],
      chargesDataDate: '2025-01-15T00:00:00.000Z',
      notificationsDataDate: '2025-01-15T00:00:00.000Z',
    };
    render(
      <AssociationStatsSection
        associations={stateWith({ items: [sameDate] })}
      />
    );

    openSection();

    expect(screen.getByText('Dane na dzień: 15.01.2025')).toBeInTheDocument();
    expect(screen.queryByText(/^Naliczenia: /)).toBeNull();
  });

  it('gives the abbreviated headers their full names as a title', () => {
    render(
      <AssociationStatsSection
        associations={stateWith({ items: ASSOCIATIONS })}
      />
    );

    openSection();

    const header = screen.getByRole('columnheader', {
      name: 'Rozl. mediów',
    });
    expect(header).toHaveAttribute('title', 'Rozliczenia mediów');
  });

  it('animates the table in when the section opens', () => {
    render(
      <AssociationStatsSection
        associations={stateWith({ items: ASSOCIATIONS })}
      />
    );

    openSection();

    expect(
      associationsTable().closest('[class*="animate-fade-in"]')
    ).not.toBeNull();
    expect(animatedWrapper(associationsTable())).not.toBeNull();
  });

  it('shows each association as a card on a phone', () => {
    setViewportWidth(PHONE_WIDTH);
    render(
      <AssociationStatsSection
        associations={stateWith({ items: ASSOCIATIONS })}
      />
    );

    openSection();

    const name = screen.getByText('Alfa', { selector: 'p' });
    const card = name.closest('li')!;
    expect(
      within(card).getByText('Ostatni okres naliczeń')
    ).toBeInTheDocument();
    expect(within(card).getByText('12.2025')).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: LAST_PERIOD_HEADER })
    ).toBeNull();
    expect(animatedWrapper(name)).not.toBeNull();
  });

  it('says so when there are no associations', () => {
    render(<AssociationStatsSection associations={stateWith({ items: [] })} />);

    openSection();

    expect(screen.getByText('Brak wspólnot')).toBeInTheDocument();
  });
});
