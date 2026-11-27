import { SuccessMessage } from '@/components/ui/success-message';
import { RecordedAnswers } from '@/components/votings/recorded-answers';
import type { OwnBallotDto } from '@/lib/voting/dto/own-ballot-dto';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';

interface Props {
  questions: VotingQuestionDto[];
  ballot: OwnBallotDto;
}

export function OwnAnswersCard({ questions, ballot }: Props) {
  return (
    <div className="space-y-4">
      <SuccessMessage>
        {ballot.fromMeeting
          ? `Lokal ${ballot.apartment}: głos oddany na zebraniu i wpisany przez zarządcę`
          : `Lokal ${ballot.apartment}: Twój głos został oddany i potwierdzony`}
      </SuccessMessage>
      <RecordedAnswers questions={questions} answers={ballot.answers} />
    </div>
  );
}
