'use client';

import Link from 'next/link';

import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VotingStatusBadge } from '@/components/votings/voting-status-badge';
import { formatDateTime } from '@/lib/shared/utils/format-date-time';
import { type SortState, toggleSort } from '@/lib/shared/utils/sort';
import type { VotingListItemDto } from '@/lib/voting/dto/voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import {
  VOTING_SORT_LABELS,
  type VotingSortKey,
} from '@/lib/voting/rules/voting-list-query';

const COUNT_COLUMNS: VotingSortKey[] = ['questions', 'ballots'];

const COLUMNS = Object.keys(VOTING_SORT_LABELS) as VotingSortKey[];

interface Props {
  votings: VotingListItemDto[];
  sort: SortState<VotingSortKey>;
  onSort: (sort: SortState<VotingSortKey>) => void;
}

export function AdminVotingsTable({ votings, sort, onSort }: Props) {
  return (
    <div className="rounded-md border bg-card">
      <Table aria-label="Głosowania" className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((key) => (
              <SortableTableHead
                key={key}
                label={VOTING_SORT_LABELS[key]}
                className={
                  COUNT_COLUMNS.includes(key) ? 'text-right' : undefined
                }
                direction={sort.key === key ? sort.direction : null}
                onSort={() => onSort(toggleSort(sort, key))}
              />
            ))}
          </TableRow>
        </TableHeader>
        {/* Keyed so the rows animate in; the headers keep the focus */}
        <TableBody
          key={`${sort.key}-${sort.direction}`}
          className="motion-safe:animate-view-switch motion-reduce:animate-none"
        >
          {votings.map((voting) => (
            <TableRow key={voting.id}>
              <TableCell className="font-medium">
                <Link
                  href={`${VOTING_PATHS.admin}/${voting.id}`}
                  className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {voting.title}
                </Link>
              </TableCell>
              <TableCell>{voting.hoaName}</TableCell>
              <TableCell>
                <VotingStatusBadge status={voting.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {voting.questionCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {voting.ballotCount}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {voting.endsAt ? formatDateTime(voting.endsAt) : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {formatDateTime(voting.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
