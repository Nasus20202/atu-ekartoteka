'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  ApartmentStatusBadge,
  DuplicateAddressBadge,
} from '@/app/admin/apartments/[hoaId]/apartment-badges';
import { buildAddressKey } from '@/app/admin/apartments/[hoaId]/apartment-list-utils';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import { cn, formatSharePercent } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import {
  type ApartmentSortKey,
  type SortState,
  toggleSort,
} from '@/lib/utils/sort';

function ApartmentTableRow({
  apartment,
  hoaId,
  isDuplicate,
}: {
  apartment: ApartmentSummaryDto;
  hoaId: string;
  isDuplicate: boolean;
}) {
  const share = formatSharePercent(apartment.shareRatio);

  return (
    <TableRow
      className={cn('relative', !apartment.isActive && 'opacity-60 grayscale')}
    >
      <TableCell className="whitespace-nowrap font-medium">
        <Link
          href={`/admin/apartments/${hoaId}/${apartment.id}`}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {formatApartmentLabel(apartment)}
        </Link>
      </TableCell>
      <TableCell className="max-w-[16rem] truncate text-muted-foreground">
        {apartment.owner}
      </TableCell>
      <TableCell className="text-right tabular-nums">{share ?? '-'}</TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <ApartmentStatusBadge isActive={apartment.isActive} />
          {isDuplicate && <DuplicateAddressBadge />}
        </div>
      </TableCell>
      <TableCell className="w-8 text-muted-foreground">
        <ChevronRight className="h-4 w-4" />
      </TableCell>
    </TableRow>
  );
}

interface ApartmentTableProps {
  apartments: ApartmentSummaryDto[];
  hoaId: string;
  duplicateAddresses: Set<string>;
  sort: SortState<ApartmentSortKey> | null;
  onSort: (sort: SortState<ApartmentSortKey> | null) => void;
}

export function ApartmentTable({
  apartments,
  hoaId,
  duplicateAddresses,
  sort,
  onSort,
}: ApartmentTableProps) {
  const directionOf = (key: ApartmentSortKey) =>
    sort?.key === key ? sort.direction : null;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              label="Adres"
              direction={directionOf('label')}
              onSort={() => onSort(toggleSort(sort, 'label'))}
            />
            <SortableTableHead
              label="Właściciel"
              direction={directionOf('owner')}
              onSort={() => onSort(toggleSort(sort, 'owner'))}
            />
            <SortableTableHead
              label="Udział"
              direction={directionOf('share')}
              onSort={() => onSort(toggleSort(sort, 'share'))}
              className="text-right"
            />
            <SortableTableHead
              label="Status"
              direction={directionOf('status')}
              onSort={() => onSort(toggleSort(sort, 'status'))}
            />
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {apartments.map((apartment) => (
            <ApartmentTableRow
              key={apartment.id}
              apartment={apartment}
              hoaId={hoaId}
              isDuplicate={
                apartment.isActive &&
                duplicateAddresses.has(buildAddressKey(apartment))
              }
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
