import { CheckCircle2 } from 'lucide-react';

import { SuccessMessage } from '@/components/ui/success-message';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import type { VoteAnswers } from '@/lib/voting/types/voting';

interface Props {
  questions: VotingQuestionDto[];
  answers: VoteAnswers;
}

export function OwnAnswersCard({ questions, answers }: Props) {
  return (
    <div className="space-y-4">
      <SuccessMessage>Twój głos został oddany i potwierdzony</SuccessMessage>
      <ol className="space-y-2 rounded-xl border bg-card p-4">
        {questions.map((question, index) => (
          <li key={question.id} className="flex items-start gap-2 text-sm">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
              aria-hidden
            />
            <span className="flex-1">
              {index + 1}. {question.text}
            </span>
            <strong>
              {answers[question.id]
                ? VOTE_CHOICE_LABELS[answers[question.id]]
                : '—'}
            </strong>
          </li>
        ))}
      </ol>
    </div>
  );
}
