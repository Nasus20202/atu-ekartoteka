import { ShieldOff, Trash2 } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { SettlementImportOptions } from '@/lib/settlements/types/prepared-file';

const CHOICES = [
  {
    name: 'cleanImport',
    id: 'settlementCleanImport',
    label:
      'Czysty import rozliczeń (usuwa zapisane rozliczenia tego samego rodzaju z okresów w plikach)',
    icon: Trash2,
    tone: 'text-destructive',
  },
  {
    name: 'skipValidation',
    id: 'settlementSkipValidation',
    label: 'Pomiń walidację rozliczeń',
    icon: ShieldOff,
    tone: 'text-orange-500',
  },
] as const;

interface Props {
  options: SettlementImportOptions;
  disabled: boolean;
  onChange: (name: keyof SettlementImportOptions, checked: boolean) => void;
}

export function SettlementImportOptionList({
  options,
  disabled,
  onChange,
}: Props) {
  return CHOICES.map(({ name, id, label, icon: Icon, tone }) => (
    <div key={name} className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={options[name]}
        disabled={disabled}
        onCheckedChange={(checked) => onChange(name, checked === true)}
      />
      <Label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
        {label}
      </Label>
    </div>
  ));
}
