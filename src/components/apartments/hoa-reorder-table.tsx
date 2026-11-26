import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {
  buildHoaAnnouncements,
  HOA_REORDER_INSTRUCTIONS,
} from '@/components/apartments/hoa-reorder-announcements';
import { HoaReorderRow } from '@/components/apartments/hoa-reorder-row';
import { useHoaRowSensors } from '@/components/apartments/use-hoa-reorder-sensors';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HoaListItemDto } from '@/lib/hoa/dto/hoa-dto';
import { moveHoaId } from '@/lib/hoa/rules/hoa-order';

interface HoaReorderTableProps {
  hoas: HoaListItemDto[];
  onReorder: (ids: string[]) => void;
}

export function HoaReorderTable({ hoas, onReorder }: HoaReorderTableProps) {
  const sensors = useHoaRowSensors();
  const ids = hoas.map((hoa) => hoa.id);
  const nameOf = (id: string) => hoas.find((hoa) => hoa.id === id)?.name ?? id;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(
      moveHoaId(
        ids,
        ids.indexOf(String(active.id)),
        ids.indexOf(String(over.id))
      )
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <DndContext
        id="hoa-reorder"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: buildHoaAnnouncements(ids, nameOf),
          screenReaderInstructions: { draggable: HOA_REORDER_INSTRUCTIONS },
        }}
      >
        <Table aria-label="Kolejność wspólnot">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">Przenieś</span>
              </TableHead>
              <TableHead className="w-12 text-center">Poz.</TableHead>
              <TableHead>Wspólnota</TableHead>
              <TableHead className="hidden sm:table-cell">Mieszkania</TableHead>
              <TableHead className="hidden sm:table-cell">
                Data importu mieszkań
              </TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Zmień pozycję</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <TableBody>
              {hoas.map((hoa, index) => (
                <HoaReorderRow
                  key={hoa.id}
                  hoa={hoa}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === hoas.length - 1}
                  onMoveUp={() => onReorder(moveHoaId(ids, index, index - 1))}
                  onMoveDown={() => onReorder(moveHoaId(ids, index, index + 1))}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}
