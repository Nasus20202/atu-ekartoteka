import { Check, type LucideIcon, Minus, X } from 'lucide-react';

import { cn } from '@/lib/shared/utils';
import {
  VOTE_CHOICE_LABELS,
  VOTE_CHOICES,
} from '@/lib/voting/rules/voting-status';
import { VoteChoice } from '@/lib/voting/types/voting';

const CHOICE_STYLES: Record<VoteChoice, { icon: LucideIcon; active: string }> =
  {
    [VoteChoice.FOR]: {
      icon: Check,
      active:
        'border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
    },
    [VoteChoice.AGAINST]: {
      icon: X,
      active:
        'border-red-600 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
    },
    [VoteChoice.ABSTAIN]: {
      icon: Minus,
      active: 'border-slate-500 bg-muted text-foreground',
    },
  };

interface Props {
  name: string;
  legend: string;
  value: VoteChoice | undefined;
  disabled?: boolean;
  onChange: (choice: VoteChoice) => void;
}

export function ChoicePicker({
  name,
  legend,
  value,
  disabled,
  onChange,
}: Props) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-base font-medium">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {VOTE_CHOICES.map((choice) => {
          const { icon: Icon, active } = CHOICE_STYLES[choice];
          const selected = value === choice;

          return (
            <label
              key={choice}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring motion-reduce:transition-none',
                selected
                  ? active
                  : 'border-input bg-background hover:bg-accent',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(choice)}
              />
              <Icon className="h-4 w-4" aria-hidden />
              {VOTE_CHOICE_LABELS[choice]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
