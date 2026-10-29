'use client';

import { Checkbox } from '@/components/ui/checkbox';

export interface UnassignedApartment {
  id: string;
  number: string;
  building: string | null;
  owner: string | null;
  email: string;
  isActive: boolean;
  hasTwinWithTenant: boolean;
}

export function aptLabel(apt: UnassignedApartment): string {
  return `${apt.building ? `Bud. ${apt.building}, ` : ''}Mieszkanie ${apt.number}`;
}

export function addressKey(apt: UnassignedApartment): string {
  return `${apt.building ?? ''}__${apt.number}`;
}

interface ApartmentRowProps {
  apt: UnassignedApartment;
  selected: boolean;
  onToggle: () => void;
  onInactiveClick: () => void;
}

export function ApartmentRow({
  apt,
  selected,
  onToggle,
  onInactiveClick,
}: ApartmentRowProps) {
  const inactive = !apt.isActive;
  return (
    <label
      htmlFor={`apt-${apt.id}`}
      className={[
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted',
        selected ? 'border-primary bg-primary/5' : '',
        inactive && !selected ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={
        inactive && !selected
          ? (e) => {
              e.preventDefault();
              onInactiveClick();
            }
          : undefined
      }
    >
      <Checkbox
        id={`apt-${apt.id}`}
        checked={selected}
        onCheckedChange={inactive ? undefined : onToggle}
        disabled={inactive && !selected}
        className="mt-0.5"
      />
      <div className="flex-1 text-sm">
        <p className={`font-medium ${inactive ? 'text-muted-foreground' : ''}`}>
          {aptLabel(apt)}
          {inactive && (
            <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Nieaktywny
            </span>
          )}
        </p>
        <p className="text-muted-foreground">
          {apt.owner && `${apt.owner} · `}
          {apt.email}
        </p>
      </div>
    </label>
  );
}
