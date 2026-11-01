'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { computeGroups } from '@/app/admin/users/management/apartment-grouping';
import {
  DuplicateAddressGroup,
  MultiApartmentEmailGroup,
  OccupiedTwinRow,
} from '@/app/admin/users/management/apartment-groups';
import {
  addressKey,
  ApartmentRow,
  UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';
import { InactiveApartmentDialog } from '@/app/admin/users/management/inactive-apartment-dialog';
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

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className={open ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-3 text-base">
              <CollapsibleTrigger
                className="flex flex-1 cursor-pointer items-center gap-2 text-left"
                data-testid={`hoa-card-${hoa.hoaId}`}
              >
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

      <InactiveApartmentDialog
        apartment={pendingInactiveApt}
        onConfirm={(apt) => onToggleApartment(apt.id)}
        onClose={() => setPendingInactiveApt(null)}
      />
    </>
  );
}
