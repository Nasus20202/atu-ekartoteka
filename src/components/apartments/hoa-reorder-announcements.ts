import type { Announcements } from '@dnd-kit/core';

export const HOA_REORDER_INSTRUCTIONS =
  'Aby przenieść wspólnotę, naciśnij spację, użyj strzałek w górę i w dół, a następnie spację, aby upuścić. Escape anuluje przenoszenie.';

/** Screen reader messages for dragging a HOA row, in Polish. */
export function buildHoaAnnouncements(
  ids: readonly string[],
  nameOf: (id: string) => string
): Announcements {
  const position = (id: string | number) =>
    `pozycja ${ids.indexOf(String(id)) + 1} z ${ids.length}`;

  return {
    onDragStart: ({ active }) =>
      `Podniesiono wspólnotę ${nameOf(String(active.id))}, ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Wspólnota ${nameOf(String(active.id))} jest nad pozycją ${ids.indexOf(String(over.id)) + 1} z ${ids.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      `Upuszczono wspólnotę ${nameOf(String(active.id))}, ${position(over?.id ?? active.id)}.`,
    onDragCancel: ({ active }) =>
      `Anulowano przenoszenie wspólnoty ${nameOf(String(active.id))}.`,
  };
}
