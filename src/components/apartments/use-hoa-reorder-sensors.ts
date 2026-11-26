import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { PointerEvent as ReactPointerEvent } from 'react';

const PRIMARY_BUTTON = 0;
const DRAG_START_DISTANCE_PX = 4;
export const DRAG_HANDLE_ATTRIBUTE = 'data-drag-handle';
// Row buttons and links keep working; only the grip button starts a drag
const INTERACTIVE = `button:not([${DRAG_HANDLE_ATTRIBUTE}]), a, input`;

/** Starts a drag from anywhere on a table row except its own controls. */
class RowPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: ReactPointerEvent) =>
        nativeEvent.isPrimary &&
        nativeEvent.button === PRIMARY_BUTTON &&
        !(nativeEvent.target as Element).closest(INTERACTIVE),
    },
  ];
}

const keyboard = { coordinateGetter: sortableKeyboardCoordinates };
const pointer = { activationConstraint: { distance: DRAG_START_DISTANCE_PX } };

/** Table rows: drag the whole row or its grip, or use the keyboard. */
export function useHoaRowSensors() {
  return useSensors(
    useSensor(RowPointerSensor, pointer),
    useSensor(KeyboardSensor, keyboard)
  );
}

/** Cards: drag the grip, or use the keyboard on it. */
export function useHoaCardSensors() {
  return useSensors(
    useSensor(PointerSensor, pointer),
    useSensor(KeyboardSensor, keyboard)
  );
}
