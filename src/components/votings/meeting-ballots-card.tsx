'use client';

import { AnimatedAlert } from '@/components/ui/animated-alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MeetingBallotForm } from '@/components/votings/meeting-ballot-form';
import { MeetingBallotList } from '@/components/votings/meeting-ballot-list';
import { useMeetingBallots } from '@/components/votings/use-meeting-ballots';
import type { VoterDto, VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import type { VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  votingId: string;
  questions: VotingQuestionDto[];
  choices: VoteChoice[];
  ballots: VoterDto[];
}

/** The votes cast at a meeting, entered into a draft by an admin. */
export function MeetingBallotsCard({
  votingId,
  questions,
  choices,
  ballots,
}: Props) {
  const form = useMeetingBallots(
    votingId,
    questions.map((question) => question.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Głosy z zebrania</CardTitle>
        <CardDescription>
          Wpisz głosy oddane na zebraniu. Za te lokale nie będzie można
          zagłosować przez internet. Po wpisaniu pierwszego głosu pytań nie
          można zmieniać.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MeetingBallotForm
          form={form}
          questions={questions}
          choices={choices}
        />
        <AnimatedAlert show={form.error !== null} variant="destructive">
          {form.error}
        </AnimatedAlert>
        <MeetingBallotList
          ballots={ballots}
          questions={questions}
          disabled={form.pending}
          onRemove={(id, label) => void form.remove(id, label)}
        />
      </CardContent>
    </Card>
  );
}
