import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeHoa,
  THREE_HOAS,
} from '@/components/apartments/__tests__/hoa-reorder-fixtures';
import { HoaListContent } from '@/components/apartments/hoa-list-content';
import { HOA_ORDER_STORAGE_KEY } from '@/lib/hoa/rules/hoa-order';

vi.mock('@/actions/apartments/hoa', () => ({ renameHoaAction: vi.fn() }));

const REORDER_LABEL = 'Zmień kolejność';

const RENAME_PREFIX = 'Zmień nazwę wspólnoty ';

function cardNames() {
  return screen
    .getAllByRole('button', { name: new RegExp(`^${RENAME_PREFIX}`) })
    .map((button) =>
      button.getAttribute('aria-label')?.slice(RENAME_PREFIX.length)
    );
}

describe('HoaListContent reordering', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('offers to reorder a list with several HOAs', () => {
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    expect(
      screen.getByRole('button', { name: REORDER_LABEL })
    ).toBeInTheDocument();
  });

  it('does not offer to reorder a single HOA', () => {
    render(<HoaListContent initialHoas={[makeHoa('a', 'Alfa')]} />);

    expect(screen.queryByRole('button', { name: REORDER_LABEL })).toBeNull();
  });

  it('shows the cards in the stored order', () => {
    window.localStorage.setItem(
      HOA_ORDER_STORAGE_KEY,
      JSON.stringify(['c', 'a', 'b'])
    );
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    expect(cardNames()).toEqual(['Gamma', 'Alfa', 'Beta']);
  });

  it('puts a HOA missing from the stored order at the end', () => {
    window.localStorage.setItem(
      HOA_ORDER_STORAGE_KEY,
      JSON.stringify(['c', 'gone'])
    );
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    expect(cardNames()).toEqual(['Gamma', 'Alfa', 'Beta']);
  });

  it('swaps the cards for the reorder table and back', async () => {
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    await user.click(screen.getByRole('button', { name: REORDER_LABEL }));

    expect(
      screen.getByRole('table', { name: 'Kolejność wspólnot' })
    ).toBeVisible();
    expect(screen.queryByText('Zobacz mieszkania')).toBeNull();
    expect(screen.queryByRole('button', { name: REORDER_LABEL })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Gotowe' }));

    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByText('Zobacz mieszkania')).toHaveLength(3);
  });

  it('animates the swap between the cards and the reorder table', async () => {
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={THREE_HOAS} />);
    const animated = (element: HTMLElement) =>
      element.closest('[class*="animate-view-switch"]');

    const cardsView = animated(screen.getAllByText('Zobacz mieszkania')[0]);
    expect(cardsView).not.toBeNull();

    await user.click(screen.getByRole('button', { name: REORDER_LABEL }));

    const tableView = animated(screen.getByRole('table'));
    expect(tableView).not.toBeNull();
    expect(tableView).not.toBe(cardsView);
  });

  it('saves a move and shows the cards in the new order afterwards', async () => {
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    await user.click(screen.getByRole('button', { name: REORDER_LABEL }));
    await user.click(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Alfa niżej' })
    );

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Beta')).toBeInTheDocument();
    expect(window.localStorage.getItem(HOA_ORDER_STORAGE_KEY)).toBe(
      JSON.stringify(['b', 'a', 'c'])
    );

    await user.click(screen.getByRole('button', { name: 'Gotowe' }));
    expect(cardNames()).toEqual(['Beta', 'Alfa', 'Gamma']);
  });

  it('restores the default order', async () => {
    window.localStorage.setItem(
      HOA_ORDER_STORAGE_KEY,
      JSON.stringify(['c', 'b', 'a'])
    );
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    await user.click(screen.getByRole('button', { name: REORDER_LABEL }));
    await user.click(screen.getByRole('button', { name: 'Przywróć domyślną' }));

    expect(window.localStorage.getItem(HOA_ORDER_STORAGE_KEY)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Gotowe' }));
    expect(cardNames()).toEqual(['Alfa', 'Beta', 'Gamma']);
  });

  it('keeps the reset button disabled until the order is changed', async () => {
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    await user.click(screen.getByRole('button', { name: REORDER_LABEL }));
    const reset = screen.getByRole('button', { name: 'Przywróć domyślną' });
    expect(reset).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Beta wyżej' })
    );
    expect(reset).toBeEnabled();
  });

  it('shows a grip on every card of the unfiltered list', () => {
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    expect(
      screen.getAllByRole('button', { name: /^Przenieś wspólnotę/ })
    ).toHaveLength(3);
  });

  it('shows no grips on a single HOA', () => {
    render(<HoaListContent initialHoas={[makeHoa('a', 'Alfa')]} />);

    expect(
      screen.queryByRole('button', { name: /^Przenieś wspólnotę/ })
    ).toBeNull();
  });

  it('shows no grips and no reorder button while a search is active', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ homeownersAssociations: THREE_HOAS.slice(0, 2) }),
      })
    );
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={THREE_HOAS} />);

    await user.type(screen.getByPlaceholderText('Wyszukaj...'), 'A{Enter}');

    await waitFor(() =>
      expect(screen.getByText(/Znaleziono 2/)).toBeInTheDocument()
    );
    expect(
      screen.queryByRole('button', { name: /^Przenieś wspólnotę/ })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: REORDER_LABEL })).toBeNull();
  });
});
