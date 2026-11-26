import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ComponentProps } from 'react';

import { HoaListCard } from '@/components/apartments/hoa-list-card';
import { cn } from '@/lib/shared/utils';

type HoaSortableCardProps = Omit<
  ComponentProps<typeof HoaListCard>,
  'dragHandle'
>;

/** A HOA card that can be dragged by its grip, next to the HOA name. */
export function HoaSortableCard(props: HoaSortableCardProps) {
  const { hoa, editing } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hoa.id });

  const grip = editing ? undefined : (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Przenieś wspólnotę ${hoa.name}`}
      className="-ml-2 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-90 shadow-xl')}
    >
      <HoaListCard {...props} dragHandle={grip} />
    </div>
  );
}
