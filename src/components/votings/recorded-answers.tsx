import { RecordedAnswer } from '@/components/votings/recorded-answer';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import type { VoteAnswers } from '@/lib/voting/types/voting';

interface Props {
  questions: VotingQuestionDto[];
  answers: VoteAnswers;
}

/** The answers of one ballot, question by question. */
export function RecordedAnswers({ questions, answers }: Props) {
  return (
    <ol className="space-y-2 rounded-xl border bg-card p-4">
      {questions.map((question, index) => (
        <RecordedAnswer
          key={question.id}
          question={`${index + 1}. ${question.text}`}
          choice={answers[question.id]}
        />
      ))}
    </ol>
  );
}
