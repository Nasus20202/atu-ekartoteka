import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import type { ComponentProps } from 'react';

import { HoaListCard } from '@/components/apartments/hoa-list-card';
import {
  buildHoaAnnouncements,
  HOA_REORDER_INSTRUCTIONS,
} from '@/components/apartments/hoa-reorder-announcements';
import { HoaSortableCard } from '@/components/apartments/hoa-sortable-card';
import { useHoaCardSensors } from '@/components/apartments/use-hoa-reorder-sensors';
import type { HoaListItemDto } from '@/lib/hoa/dto/hoa-dto';
import { moveHoaId } from '@/lib/hoa/rules/hoa-order';

const GRID_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';

type CardProps = Omit<ComponentProps<typeof HoaListCard>, 'dragHandle'>;

interface HoaCardGridProps {
  hoas: HoaListItemDto[];
  /** Cards get a grip and can be dragged; off while the list is filtered. */
  sortable: boolean;
  onReorder: (ids: string[]) => void;
  cardProps: (hoa: HoaListItemDto) => CardProps;
}

export function HoaCardGrid({
  hoas,
  sortable,
  onReorder,
  cardProps,
}: HoaCardGridProps) {
  const sensors = useHoaCardSensors();
  const ids = hoas.map((hoa) => hoa.id);

  if (!sortable) {
    return (
      <div className={GRID_CLASS}>
        {hoas.map((hoa) => (
          <HoaListCard key={hoa.id} {...cardProps(hoa)} />
        ))}
      </div>
    );
  }

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
    <DndContext
      id="hoa-grid"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: buildHoaAnnouncements(
          ids,
          (id) => hoas.find((hoa) => hoa.id === id)?.name ?? id
        ),
        screenReaderInstructions: { draggable: HOA_REORDER_INSTRUCTIONS },
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={GRID_CLASS}>
          {hoas.map((hoa) => (
            <HoaSortableCard key={hoa.id} {...cardProps(hoa)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
