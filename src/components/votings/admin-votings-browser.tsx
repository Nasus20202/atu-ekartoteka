'use client';

import { ListChecks } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ListViewSwitch } from '@/components/ui/list-view-switch';
import { ViewTransition } from '@/components/ui/view-transition';
import { AdminVotingCards } from '@/components/votings/admin-voting-cards';
import { AdminVotingsTable } from '@/components/votings/admin-votings-table';
import type { HoaOption } from '@/components/votings/use-hoa-options';
import { useVotingListParams } from '@/components/votings/use-voting-list-params';
import { VotingFilters } from '@/components/votings/voting-filters';
import {
  LIST_VIEW_STORAGE_KEYS,
  ListViewMode,
  useListViewMode,
} from '@/hooks/use-list-view-mode';
import type { VotingListItemDto } from '@/lib/voting/dto/voting-dto';
import type { VotingListQuery } from '@/lib/voting/rules/voting-list-query';

interface Props {
  votings: VotingListItemDto[];
  query: VotingListQuery;
  hoas: HoaOption[];
  initialViewMode?: ListViewMode;
}

/** The admin's votings, as cards or as a table, filtered and ordered. */
export function AdminVotingsBrowser({
  votings,
  query,
  hoas,
  initialViewMode,
}: Props) {
  const [viewMode, setViewMode] = useListViewMode(
    LIST_VIEW_STORAGE_KEYS.votings,
    initialViewMode
  );
  const params = useVotingListParams();
  const filtered = Boolean(query.hoaId || query.status);
  // The table animates a new order itself, so its headings keep the focus
  const cardOrder =
    viewMode === ListViewMode.CARDS &&
    `${query.sort.key}-${query.sort.direction}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <VotingFilters
          query={query}
          hoas={hoas}
          withSort={viewMode === ListViewMode.CARDS}
          onHoaChange={params.setHoa}
          onStatusChange={params.setStatus}
          onSortChange={params.setSort}
        />
        <ListViewSwitch value={viewMode} onChange={setViewMode} />
      </div>
      <ViewTransition
        view={`${viewMode}-${query.hoaId}-${query.status}-${cardOrder}`}
      >
        {votings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 py-12 text-center">
              <ListChecks className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {filtered ? 'Brak pasujących głosowań' : 'Brak głosowań'}
              </p>
              <p className="text-sm text-muted-foreground">
                {filtered
                  ? 'Zmień wspólnotę lub stan, aby zobaczyć inne głosowania.'
                  : 'Utwórz pierwsze głosowanie dla wybranej wspólnoty.'}
              </p>
              {filtered && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={params.clearFilters}
                >
                  Wyczyść filtry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === ListViewMode.TABLE ? (
          <AdminVotingsTable
            votings={votings}
            sort={query.sort}
            onSort={params.setSort}
          />
        ) : (
          <AdminVotingCards votings={votings} />
        )}
      </ViewTransition>
    </div>
  );
}
