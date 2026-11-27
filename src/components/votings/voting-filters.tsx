'use client';

import { Select } from '@/components/ui/select';
import { HoaCombobox } from '@/components/votings/hoa-combobox';
import type { HoaOption } from '@/components/votings/use-hoa-options';
import type { SortState } from '@/lib/shared/utils/sort';
import {
  VOTING_SORT_LABELS,
  type VotingListQuery,
  type VotingSortKey,
} from '@/lib/voting/rules/voting-list-query';
import { VOTING_STATUS_LABELS } from '@/lib/voting/rules/voting-status';

const STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie stany' },
  ...Object.entries(VOTING_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const DIRECTION_LABELS = { asc: 'rosnąco', desc: 'malejąco' } as const;

const SORT_OPTIONS = Object.entries(VOTING_SORT_LABELS).flatMap(
  ([key, label]) =>
    Object.entries(DIRECTION_LABELS).map(([direction, wording]) => ({
      value: `${key}:${direction}`,
      label: `${label}, ${wording}`,
    }))
);

interface Props {
  query: VotingListQuery;
  hoas: HoaOption[];
  /** Offered where there are no column headings to sort by */
  withSort: boolean;
  onHoaChange: (hoaId: string) => void;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: SortState<VotingSortKey>) => void;
}

export function VotingFilters({
  query,
  hoas,
  withSort,
  onHoaChange,
  onStatusChange,
  onSortChange,
}: Props) {
  const { sort } = query;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <HoaCombobox
        aria-label="Filtr wspólnoty"
        className="sm:w-60"
        hoas={hoas}
        allLabel="Wszystkie wspólnoty"
        value={query.hoaId ?? ''}
        onValueChange={onHoaChange}
      />
      <Select
        aria-label="Filtr stanu"
        className="sm:w-52"
        value={query.status ?? ''}
        options={STATUS_OPTIONS}
        onValueChange={onStatusChange}
      />
      {withSort && (
        <Select
          aria-label="Sortowanie"
          className="sm:w-60"
          value={`${sort.key}:${sort.direction}`}
          options={SORT_OPTIONS}
          onValueChange={(value) => {
            const [key, direction] = value.split(':');
            onSortChange({ key, direction } as SortState<VotingSortKey>);
          }}
        />
      )}
    </div>
  );
}
