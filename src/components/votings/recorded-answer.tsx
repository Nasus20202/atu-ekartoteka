import { CHOICE_STYLES } from '@/components/votings/choice-styles';
import { cn } from '@/lib/shared/utils';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import type { VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  /** The question with its number */
  question: string;
  choice: VoteChoice | undefined;
}

/** A question with the answer given to it, marked by the answer's icon. */
export function RecordedAnswer({ question, choice }: Props) {
  const style = choice && CHOICE_STYLES[choice];
  const Icon = style?.icon;

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 h-4 w-4 shrink-0">
        {Icon && <Icon className={cn('h-4 w-4', style.tone)} aria-hidden />}
      </span>
      <span className="flex-1">{question}</span>
      <strong>{choice ? VOTE_CHOICE_LABELS[choice] : '—'}</strong>
    </li>
  );
}
