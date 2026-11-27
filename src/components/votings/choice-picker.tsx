import { CHOICE_STYLES } from '@/components/votings/choice-styles';
import { cn } from '@/lib/shared/utils';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import type { VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  name: string;
  legend: string;
  choices: VoteChoice[];
  value: VoteChoice | undefined;
  disabled?: boolean;
  onChange: (choice: VoteChoice) => void;
}

export function ChoicePicker({
  name,
  legend,
  choices,
  value,
  disabled,
  onChange,
}: Props) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-base font-medium">{legend}</legend>
      <div
        className={cn(
          'grid gap-2',
          // One column per choice on wider screens
          choices.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        )}
      >
        {choices.map((choice) => {
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
