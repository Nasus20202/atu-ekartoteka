import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import {
  confirmationId,
  confirmationLabel,
} from '@/components/settlement-import/labels';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type {
  SettlementConfirmation,
  SettlementPreviewRecordDto,
} from '@/lib/settlements/dto/settlement-import-dto';
import { cn } from '@/lib/shared/utils';

interface Props {
  records: SettlementPreviewRecordDto[];
  accepted: SettlementConfirmation[];
  disabled: boolean;
  onChange: (confirmation: SettlementConfirmation, checked: boolean) => void;
}

export function SettlementConfirmations({
  records,
  accepted,
  disabled,
  onChange,
}: Props) {
  const required = records.flatMap((record) =>
    record.confirmations.map((reason) => ({ record, reason }))
  );
  if (required.length === 0) return null;

  const items = required.map(({ record, reason }) => ({
    record,
    reason,
    checked: accepted.some((c) => c.key === record.key && c.reason === reason),
  }));
  const ticked = items.filter((item) => item.checked).length;
  const complete = ticked === items.length;
  const Icon = complete ? CheckCircle2 : AlertTriangle;
  const border = complete ? 'border-emerald-600' : 'border-amber-500';

  return (
    <fieldset
      className={cn(
        'space-y-2 rounded-lg border-2 p-3 motion-safe:transition-colors',
        border,
        complete ? 'bg-emerald-500/10' : 'bg-amber-500/10'
      )}
    >
      <legend
        className={cn(
          'flex items-center gap-2 rounded-md border-2 bg-background px-2 py-1 text-sm font-semibold',
          border
        )}
      >
        <Icon
          key={String(complete)}
          className={cn(
            'h-4 w-4 shrink-0 motion-safe:animate-scale-in',
            complete
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          )}
          aria-hidden="true"
        />
        Wymagane potwierdzenia: {ticked} z {items.length}
      </legend>
      <p className="text-sm">
        Plik zostanie zapisany dopiero po zaznaczeniu wszystkich pozycji.
      </p>
      {items.map(({ record, reason, checked }) => {
        const id = confirmationId(record.key, reason);
        return (
          <div
            key={id}
            className="flex items-start gap-3 rounded-md border bg-background pl-3"
          >
            <Checkbox
              id={id}
              className="mt-3.5"
              disabled={disabled}
              checked={checked}
              onCheckedChange={(value) =>
                onChange({ key: record.key, reason }, value === true)
              }
            />
            <Label
              htmlFor={id}
              className="flex-1 cursor-pointer py-3 pr-3 text-sm leading-snug"
            >
              {confirmationLabel(reason, record)}
            </Label>
          </div>
        );
      })}
    </fieldset>
  );
}
