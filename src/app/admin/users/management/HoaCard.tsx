'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import {
  computeGroups,
  DuplicateAddressGroup,
  MultiApartmentEmailGroup,
  OccupiedTwinRow,
} from '@/app/admin/users/management/ApartmentGroups';
import {
  addressKey,
  ApartmentRow,
  UnassignedApartment,
} from '@/app/admin/users/management/ApartmentRow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApartmentCount } from '@/components/ui/apartment-count';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export type { UnassignedApartment };

export interface HoaGroup {
  hoaId: string;
  hoaName: string;
  apartments: UnassignedApartment[];
}

interface HoaCardProps {
  hoa: HoaGroup;
  selectedIds: Set<string>;
  isHoaSelected: boolean;
  isHoaIndeterminate: boolean;
  onToggleHoa: () => void;
  onToggleApartment: (id: string) => void;
  onSelectIds: (ids: string[], checked: boolean) => void;
}

export function HoaCard({
  hoa,
  selectedIds,
  isHoaSelected,
  isHoaIndeterminate,
  onToggleHoa,
  onToggleApartment,
  onSelectIds,
}: HoaCardProps) {
  const [open, setOpen] = useState(false);
  const [pendingInactiveApt, setPendingInactiveApt] =
    useState<UnassignedApartment | null>(null);

  const { duplicateAddressGroups, occupiedTwins, emailGroups, singles } =
    computeGroups(hoa.apartments);

  function handleConfirmInactive() {
    if (!pendingInactiveApt) return;
    onToggleApartment(pendingInactiveApt.id);
    setPendingInactiveApt(null);
  }

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className={open ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-3 text-base">
              <CollapsibleTrigger className="flex flex-1 cursor-pointer items-center gap-2 text-left">
                <span className="flex-1">{hoa.hoaName}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  <ApartmentCount count={hoa.apartments.length} />
                </span>
                {open ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
            </CardTitle>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-3 pb-1">
                <Checkbox
                  id={`hoa-${hoa.hoaId}`}
                  checked={isHoaSelected}
                  data-indeterminate={isHoaIndeterminate}
                  onCheckedChange={onToggleHoa}
                  aria-label={`Zaznacz wszystkie w ${hoa.hoaName}`}
                />
                <label
                  htmlFor={`hoa-${hoa.hoaId}`}
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  Zaznacz wszystkie
                </label>
              </div>
              {duplicateAddressGroups.map((group) => (
                <DuplicateAddressGroup
                  key={addressKey(group[0])}
                  group={group}
                  selectedIds={selectedIds}
                  onToggleApartment={onToggleApartment}
                  onSelectIds={onSelectIds}
                  onInactiveClick={setPendingInactiveApt}
                />
              ))}
              {occupiedTwins.map((apt) => (
                <OccupiedTwinRow
                  key={apt.id}
                  apt={apt}
                  selected={selectedIds.has(apt.id)}
                  onToggleApartment={onToggleApartment}
                  onInactiveClick={setPendingInactiveApt}
                />
              ))}
              {emailGroups.map((group) => (
                <MultiApartmentEmailGroup
                  key={group[0].email}
                  group={group}
                  selectedIds={selectedIds}
                  onToggleApartment={onToggleApartment}
                  onSelectIds={onSelectIds}
                  onInactiveClick={setPendingInactiveApt}
                />
              ))}
              {singles.map((apt) => (
                <ApartmentRow
                  key={apt.id}
                  apt={apt}
                  selected={selectedIds.has(apt.id)}
                  onToggle={() => onToggleApartment(apt.id)}
                  onInactiveClick={() => setPendingInactiveApt(apt)}
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AlertDialog
        open={pendingInactiveApt !== null}
        onOpenChange={(open) => {
          if (!open) setPendingInactiveApt(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nieaktywne mieszkanie</AlertDialogTitle>
            <AlertDialogDescription>
              To mieszkanie jest oznaczone jako nieaktywne. Czy na pewno chcesz
              uwzględnić je przy tworzeniu konta użytkownika?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInactive}>
              Tak, zaznacz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
