import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminVotingsBrowser } from '@/components/votings/admin-votings-browser';
import type { VotingListItemDto } from '@/lib/voting/dto/voting-dto';
import {
  ALL_VOTINGS,
  type VotingListQuery,
} from '@/lib/voting/rules/voting-list-query';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/admin/votings',
  useSearchParams: () => new URLSearchParams(),
}));

const VOTING: VotingListItemDto = {
  id: 'v1',
  title: 'Remont dachu',
  status: 'ACTIVE',
  endsAt: null,
  createdAt: '2026-06-01T10:00:00.000Z',
  hoaId: 'h1',
  hoaName: 'Lipowa',
  questionCount: 3,
  ballotCount: 7,
};

const renderBrowser = (
  query: VotingListQuery = ALL_VOTINGS,
  votings = [VOTING]
) =>
  render(
    <AdminVotingsBrowser
      votings={votings}
      query={query}
      hoas={[{ id: 'h1', name: 'Lipowa' }]}
    />
  );

const click = (name: string) =>
  userEvent.click(screen.getByRole('button', { name }));

describe('AdminVotingsBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('switches from cards to an animated table with sortable columns', async () => {
    renderBrowser();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await click('Tabela');

    const table = screen.getByRole('table', { name: 'Głosowania' });
    expect(table.closest('.motion-safe\\:animate-view-switch')).not.toBeNull();
    const [, row] = within(table).getAllByRole('row');
    expect(row).toHaveTextContent('Remont dachu');
    expect(row).toHaveTextContent('Lipowa');
    expect(row).toHaveTextContent('Aktywne');
    expect(
      screen.getByRole('columnheader', { name: 'Utworzono' })
    ).toHaveAttribute('aria-sort', 'descending');
    // The headings sort here, so the select of the cards is gone
    expect(
      screen.queryByRole('button', { name: 'Sortowanie' })
    ).not.toBeInTheDocument();

    await click('Oddane głosy');

    expect(replace).toHaveBeenCalledWith(
      '/admin/votings?sort=ballots&order=asc',
      { scroll: false }
    );
  });

  it('sorts the cards with the select', async () => {
    renderBrowser();

    await click('Sortowanie');
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Tytuł, rosnąco' })
    );

    expect(replace).toHaveBeenCalledWith(
      '/admin/votings?sort=title&order=asc',
      { scroll: false }
    );
  });

  it('filters by state and by association', async () => {
    renderBrowser();

    await click('Filtr stanu');
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Zakończone' })
    );
    expect(replace).toHaveBeenLastCalledWith('/admin/votings?status=CLOSED', {
      scroll: false,
    });

    await click('Filtr wspólnoty');
    await userEvent.click(screen.getByRole('option', { name: 'Lipowa' }));
    expect(replace).toHaveBeenLastCalledWith('/admin/votings?hoa=h1', {
      scroll: false,
    });
  });

  it('offers to clear filters that match nothing', async () => {
    renderBrowser({ ...ALL_VOTINGS, status: 'DRAFT' }, []);

    await click('Wyczyść filtry');

    expect(replace).toHaveBeenCalledWith('/admin/votings', { scroll: false });
  });

  it.each([
    [null, '—'],
    ['2026-12-15T11:00:00.000Z', /15 grudnia 2026/],
  ])('shows the deadline %j in the table', async (endsAt, shown) => {
    renderBrowser(ALL_VOTINGS, [{ ...VOTING, endsAt }]);

    await click('Tabela');

    expect(screen.getByRole('cell', { name: shown })).toBeInTheDocument();
  });

  it('animates the cards in when their order changes', () => {
    const { rerender } = renderBrowser();
    const animated = () =>
      screen.getByRole('list').closest('.motion-safe\\:animate-view-switch');
    const before = animated();
    expect(before).not.toBeNull();

    rerender(
      <AdminVotingsBrowser
        votings={[VOTING]}
        query={{ ...ALL_VOTINGS, sort: { key: 'title', direction: 'asc' } }}
        hoas={[{ id: 'h1', name: 'Lipowa' }]}
      />
    );

    expect(animated()).not.toBe(before);
  });
});
