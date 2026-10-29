import { AlertTriangle, Info, UserCheck } from 'lucide-react';

import {
  ApartmentRow,
  aptLabel,
  type UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';
import {
  type ApartmentGroupSelectionProps,
  SelectableApartmentGroup,
} from '@/app/admin/users/management/selectable-apartment-group';
import { APARTMENT_FORMS, formatCountPl } from '@/lib/utils/pluralize';

export function DuplicateAddressGroup(props: ApartmentGroupSelectionProps) {
  const { group } = props;
  return (
    <SelectableApartmentGroup
      {...props}
      tone="amber"
      checkboxId={`dup-${group.map((a) => a.id).join('-')}`}
      header={
        <>
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium">{aptLabel(group[0])}</span>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
            Duplikat — {group.length}×
          </span>
        </>
      }
    />
  );
}

export function MultiApartmentEmailGroup(props: ApartmentGroupSelectionProps) {
  const { group } = props;
  return (
    <SelectableApartmentGroup
      {...props}
      tone="blue"
      checkboxId={`email-group-${group[0].email}`}
      header={
        <>
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">{group[0].email}</span>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
            {formatCountPl(group.length, APARTMENT_FORMS)}
          </span>
        </>
      }
    />
  );
}

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
