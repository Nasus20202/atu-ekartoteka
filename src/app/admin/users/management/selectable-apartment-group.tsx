'use client';

import type { ReactNode } from 'react';

import {
  ApartmentRow,
  getActiveIds,
  type UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';
import { Checkbox } from '@/components/ui/checkbox';

const TONE_CLASSES = {
  amber: {
    container:
      'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
    divider: 'border-amber-200 dark:border-amber-800',
  },
  blue: {
    container:
      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
    divider: 'border-blue-200 dark:border-blue-800',
  },
} as const;

export interface ApartmentGroupSelectionProps {
  group: UnassignedApartment[];
  selectedIds: Set<string>;
  onToggleApartment: (id: string) => void;
  onSelectIds: (ids: string[], checked: boolean) => void;
  onInactiveClick: (apt: UnassignedApartment) => void;
}

interface SelectableApartmentGroupProps extends ApartmentGroupSelectionProps {
  checkboxId: string;
  tone: keyof typeof TONE_CLASSES;
  header: ReactNode;
}

export function SelectableApartmentGroup({
  group,
  selectedIds,
  onToggleApartment,
  onSelectIds,
  onInactiveClick,
  checkboxId,
  tone,
  header,
}: SelectableApartmentGroupProps) {
  const ids = group.map((a) => a.id);
  const activeIds = getActiveIds(group);
  const allSelected =
    activeIds.length > 0 && activeIds.every((id) => selectedIds.has(id));
  const someSelected = ids.some((id) => selectedIds.has(id));
  const classes = TONE_CLASSES[tone];

  function handleGroupToggle() {
    if (allSelected) {
      onSelectIds(ids, false);
    } else if (activeIds.length > 0) {
      onSelectIds(activeIds, true);
    } else {
      onInactiveClick(group[0]);
    }
  }

  return (
    <div className={`rounded-lg border ${classes.container}`}>
      <div className="flex items-center gap-3 p-3">
        <Checkbox
          id={checkboxId}
          checked={allSelected}
          data-indeterminate={someSelected && !allSelected}
          onCheckedChange={handleGroupToggle}
          className="mt-0.5 shrink-0"
        />
        <div className="flex flex-1 flex-wrap items-center gap-2">{header}</div>
      </div>
      <div className={`space-y-1 border-t px-3 pb-3 pt-2 ${classes.divider}`}>
        {group.map((apt) => (
          <ApartmentRow
            key={apt.id}
            apt={apt}
            selected={selectedIds.has(apt.id)}
            onToggle={() => onToggleApartment(apt.id)}
            onInactiveClick={() => onInactiveClick(apt)}
          />
        ))}
      </div>
    </div>
  );
}
