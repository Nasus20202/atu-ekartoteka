'use client';

import { AlertTriangle, Info, UserCheck } from 'lucide-react';

import {
  addressKey,
  ApartmentRow,
  aptLabel,
  UnassignedApartment,
} from '@/app/admin/users/management/ApartmentRow';
import { Checkbox } from '@/components/ui/checkbox';

export interface ApartmentGroups {
  duplicateAddressGroups: UnassignedApartment[][];
  occupiedTwins: UnassignedApartment[];
  emailGroups: UnassignedApartment[][];
  singles: UnassignedApartment[];
}

export function computeGroups(
  apartments: UnassignedApartment[]
): ApartmentGroups {
  const addrMap = new Map<string, UnassignedApartment[]>();
  for (const apt of apartments) {
    const key = addressKey(apt);
    if (!addrMap.has(key)) addrMap.set(key, []);
    addrMap.get(key)!.push(apt);
  }

  const duplicateIds = new Set<string>();
  const duplicateAddressGroups: UnassignedApartment[][] = [];
  for (const group of addrMap.values()) {
    if (group.length > 1) {
      duplicateAddressGroups.push(group);
      group.forEach((a) => duplicateIds.add(a.id));
    }
  }

  // Apartments not in a duplicate-address group but whose address is already
  // occupied by a tenant in another DB record
  const afterDuplicates = apartments.filter((a) => !duplicateIds.has(a.id));
  const occupiedTwinIds = new Set<string>();
  const occupiedTwins: UnassignedApartment[] = [];
  for (const apt of afterDuplicates) {
    if (apt.hasTwinWithTenant) {
      occupiedTwins.push(apt);
      occupiedTwinIds.add(apt.id);
    }
  }

  const remaining = afterDuplicates.filter((a) => !occupiedTwinIds.has(a.id));
  const emailMap = new Map<string, UnassignedApartment[]>();
  for (const apt of remaining) {
    if (!emailMap.has(apt.email)) emailMap.set(apt.email, []);
    emailMap.get(apt.email)!.push(apt);
  }

  const emailGroupIds = new Set<string>();
  const emailGroups: UnassignedApartment[][] = [];
  for (const group of emailMap.values()) {
    if (group.length >= 3) {
      emailGroups.push(group);
      group.forEach((a) => emailGroupIds.add(a.id));
    }
  }

  const singles = remaining.filter((a) => !emailGroupIds.has(a.id));
  return { duplicateAddressGroups, occupiedTwins, emailGroups, singles };
}

// --- Duplicate Address Group (amber) ---

interface DuplicateGroupProps {
  group: UnassignedApartment[];
  selectedIds: Set<string>;
  onToggleApartment: (id: string) => void;
  onSelectIds: (ids: string[], checked: boolean) => void;
  onInactiveClick: (apt: UnassignedApartment) => void;
}

export function DuplicateAddressGroup({
  group,
  selectedIds,
  onToggleApartment,
  onSelectIds,
  onInactiveClick,
}: DuplicateGroupProps) {
  const ids = group.map((a) => a.id);
  const allSelected = ids.every((id) => selectedIds.has(id));
  const someSelected = ids.some((id) => selectedIds.has(id));
  const hasInactive = group.some((a) => !a.isActive);

  function handleGroupToggle() {
    if (hasInactive && !allSelected) {
      onInactiveClick(group.find((a) => !a.isActive)!);
      return;
    }
    onSelectIds(ids, !allSelected);
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-3 p-3">
        <Checkbox
          id={`dup-${ids.join('-')}`}
          checked={allSelected}
          data-indeterminate={someSelected && !allSelected}
          onCheckedChange={handleGroupToggle}
          className="mt-0.5 shrink-0"
        />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium">{aptLabel(group[0])}</span>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
            Duplikat — {group.length}×
          </span>
        </div>
      </div>
      <div className="space-y-1 border-t border-amber-200 px-3 pb-3 pt-2 dark:border-amber-800">
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

// --- Occupied Twin Row (orange) ---

interface OccupiedTwinRowProps {
  apt: UnassignedApartment;
  selected: boolean;
  onToggleApartment: (id: string) => void;
  onInactiveClick: (apt: UnassignedApartment) => void;
}

export function OccupiedTwinRow({
  apt,
  selected,
  onToggleApartment,
  onInactiveClick,
}: OccupiedTwinRowProps) {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
        <UserCheck className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/60 dark:text-orange-200">
          Mieszkanie o tym adresie zostało już przypisane
        </span>
      </div>
      <div className="px-3 pb-3 pt-1">
        <ApartmentRow
          apt={apt}
          selected={selected}
          onToggle={() => onToggleApartment(apt.id)}
          onInactiveClick={() => onInactiveClick(apt)}
        />
      </div>
    </div>
  );
}

// --- Multi-apartment Email Group (blue) ---

interface EmailGroupProps {
  group: UnassignedApartment[];
  selectedIds: Set<string>;
  onToggleApartment: (id: string) => void;
  onSelectIds: (ids: string[], checked: boolean) => void;
  onInactiveClick: (apt: UnassignedApartment) => void;
}

export function MultiApartmentEmailGroup({
  group,
  selectedIds,
  onToggleApartment,
  onSelectIds,
  onInactiveClick,
}: EmailGroupProps) {
  const ids = group.map((a) => a.id);
  const allSelected = ids.every((id) => selectedIds.has(id));
  const someSelected = ids.some((id) => selectedIds.has(id));
  const hasInactive = group.some((a) => !a.isActive);

  function handleGroupToggle() {
    if (hasInactive && !allSelected) {
      onInactiveClick(group.find((a) => !a.isActive)!);
      return;
    }
    onSelectIds(ids, !allSelected);
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-center gap-3 p-3">
        <Checkbox
          id={`email-group-${group[0].email}`}
          checked={allSelected}
          data-indeterminate={someSelected && !allSelected}
          onCheckedChange={handleGroupToggle}
          className="mt-0.5 shrink-0"
        />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">{group[0].email}</span>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
            {group.length} mieszkania
          </span>
        </div>
      </div>
      <div className="space-y-1 border-t border-blue-200 px-3 pb-3 pt-2 dark:border-blue-800">
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
