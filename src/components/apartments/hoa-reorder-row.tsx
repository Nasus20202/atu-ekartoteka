import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

import { formatImportDate } from '@/components/apartments/hoa-labels';
import { DRAG_HANDLE_ATTRIBUTE } from '@/components/apartments/use-hoa-reorder-sensors';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { HoaListItemDto } from '@/lib/hoa/dto/hoa-dto';
import { cn } from '@/lib/shared/utils';
import { APARTMENT_FORMS, pluralizePl } from '@/lib/shared/utils/pluralize';

const EMPTY_VALUE = '—';

interface HoaReorderRowProps {
  hoa: HoaListItemDto;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function HoaReorderRow({
  hoa,
  position,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: HoaReorderRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hoa.id });

  return (
    <TableRow
      ref={setNodeRef}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform && { ...transform, x: 0 }),
        transition,
      }}
      className={cn(
        'cursor-grab bg-background',
        isDragging && 'relative z-10 cursor-grabbing shadow-lg'
      )}
    >
      <TableCell className="w-10 pr-0">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...{ [DRAG_HANDLE_ATTRIBUTE]: true }}
          {...attributes}
          aria-label={`Przenieś wspólnotę ${hoa.name}`}
          className="flex h-8 w-8 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </TableCell>
      <TableCell className="w-12 text-center tabular-nums text-muted-foreground">
        {position}
      </TableCell>
      <TableCell className="max-w-[16rem]">
        <div className="truncate font-medium">{hoa.name}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {hoa.externalId}
        </div>
      </TableCell>
      <TableCell className="hidden whitespace-nowrap sm:table-cell">
        <span className="font-semibold tabular-nums text-primary">
          {hoa.apartmentCount}
        </span>{' '}
        <span className="text-muted-foreground">
          {pluralizePl(hoa.apartmentCount, APARTMENT_FORMS)}
        </span>
      </TableCell>
      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
        {formatImportDate(hoa.apartmentsDataDate) ?? EMPTY_VALUE}
      </TableCell>
      <TableCell className="w-20">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label={`Przesuń wspólnotę ${hoa.name} wyżej`}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isLast}
            onClick={onMoveDown}
            aria-label={`Przesuń wspólnotę ${hoa.name} niżej`}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
