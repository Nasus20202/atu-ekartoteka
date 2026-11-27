import { CHOICE_STYLES } from '@/components/votings/choice-styles';
import { cn } from '@/lib/shared/utils';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import type { VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  answers: Record<string, VoteChoice>;
  questions: VotingQuestionDto[];
}

/** One ballot's answers, numbered like the questions. */
export function AnswerChips({ answers, questions }: Props) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {questions.map((question, index) => {
        const choice = answers[question.id];

        return (
          <li
            key={question.id}
            title={question.text}
            className={cn(
              'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
              choice && CHOICE_STYLES[choice].chip
            )}
          >
            {index + 1}. {choice ? VOTE_CHOICE_LABELS[choice] : '—'}
          </li>
        );
      })}
    </ul>
  );
}
