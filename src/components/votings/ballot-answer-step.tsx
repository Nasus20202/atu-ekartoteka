import { Button } from '@/components/ui/button';
import { ApartmentAnswers } from '@/components/votings/apartment-answers';
import type {
  ApartmentProgress,
  DraftAnswers,
} from '@/components/votings/use-ballot';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import type { VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  questions: VotingQuestionDto[];
  choices: VoteChoice[];
  apartments: { id: string; label: string }[];
  severalOwned: boolean;
  answers: DraftAnswers;
  progress: (apartmentId: string) => ApartmentProgress;
  canSubmit: boolean;
  pending: boolean;
  onChoose: (
    apartmentId: string,
    questionId: string,
    choice: VoteChoice
  ) => void;
  onClear: (apartmentId: string) => void;
  onSubmit: () => void;
}

export function BallotAnswerStep({
  apartments,
  severalOwned,
  answers,
  progress,
  canSubmit,
  pending,
  onChoose,
  onClear,
  onSubmit,
  ...ballot
}: Props) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {apartments.length > 1 && (
        <p className="rounded-lg bg-muted/50 p-3 text-sm">
          Każdy lokal głosuje osobno. Możesz wypełnić tylko część lokali, a za
          pozostałe zagłosować później.
        </p>
      )}
      {apartments.map((apartment) => (
        <ApartmentAnswers
          key={apartment.id}
          {...ballot}
          apartment={apartment}
          named={severalOwned}
          answers={answers[apartment.id] ?? {}}
          unfinished={
            apartments.length > 1 && progress(apartment.id) === 'partial'
          }
          disabled={pending}
          onChoose={(questionId, choice) =>
            onChoose(apartment.id, questionId, choice)
          }
          onClear={() => onClear(apartment.id)}
        />
      ))}
      <Button type="submit" disabled={pending || !canSubmit}>
        Dalej – potwierdź emailem
      </Button>
    </form>
  );
}
