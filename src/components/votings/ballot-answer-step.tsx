import { Button } from '@/components/ui/button';
import { ChoicePicker } from '@/components/votings/choice-picker';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import type { VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  questions: VotingQuestionDto[];
  answers: Partial<VoteAnswers>;
  apartmentCount: number;
  isComplete: boolean;
  pending: boolean;
  onChoose: (questionId: string, choice: VoteChoice) => void;
  onSubmit: () => void;
}

export function BallotAnswerStep({
  questions,
  answers,
  apartmentCount,
  isComplete,
  pending,
  onChoose,
  onSubmit,
}: Props) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {apartmentCount > 1 && (
        <p className="rounded-lg bg-muted/50 p-3 text-sm">
          Masz {apartmentCount} lokale w tej wspólnocie. Twoje odpowiedzi
          zostaną zapisane dla każdego z nich.
        </p>
      )}
      {questions.map((question, index) => (
        <ChoicePicker
          key={question.id}
          name={`question-${question.id}`}
          legend={`${index + 1}. ${question.text}`}
          value={answers[question.id]}
          disabled={pending}
          onChange={(choice) => onChoose(question.id, choice)}
        />
      ))}
      <Button type="submit" disabled={pending || !isComplete}>
        Dalej – potwierdź kodem
      </Button>
    </form>
  );
}
