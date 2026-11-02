import { Check } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import { formatSharePercent } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

interface ApartmentOptionProps {
  apartment: ApartmentSummaryDto;
  selected: boolean;
  matching: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ApartmentOption({
  apartment,
  selected,
  matching,
  onCheckedChange,
}: ApartmentOptionProps) {
  const sharePercent = formatSharePercent(apartment.shareRatio);

  return (
    <label
      htmlFor={`apt-${apartment.id}`}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:bg-muted hover:scale-[1.02] ${
        selected
          ? 'border-primary bg-primary/5'
          : matching
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : !apartment.isActive
              ? 'opacity-60'
              : ''
      }`}
    >
      <Checkbox
        id={`apt-${apartment.id}`}
        checked={selected}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {formatApartmentLabel(apartment)}
          </p>
          {!apartment.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Nieaktywny
            </span>
          )}
          {matching && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              <Check className="h-3 w-3" />
              Dopasowanie
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {apartment.postalCode} {apartment.city} • Budynek:{' '}
          {apartment.building} • Właściciel: {apartment.owner}
        </p>
        {apartment.email && (
          <p className="text-xs text-muted-foreground">
            Email: {apartment.email}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Procent: {sharePercent ?? '-'} • ID: {apartment.externalApartmentId} /{' '}
          {apartment.externalOwnerId}
        </p>
      </div>
    </label>
  );
}
