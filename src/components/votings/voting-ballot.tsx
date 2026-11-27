'use client';

import { AnimatedAlert } from '@/components/ui/animated-alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ViewTransition } from '@/components/ui/view-transition';
import { BallotAnswerStep } from '@/components/votings/ballot-answer-step';
import { BallotSentStep } from '@/components/votings/ballot-sent-step';
import { useBallot } from '@/components/votings/use-ballot';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';

interface Props {
  votingId: string;
  questions: VotingQuestionDto[];
  apartmentCount: number;
}

export function VotingBallot({ votingId, questions, apartmentCount }: Props) {
  const ballot = useBallot(
    votingId,
    questions.map((question) => question.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Twój głos</CardTitle>
        <CardDescription>
          Odpowiedz na wszystkie pytania. Przed zapisaniem głosu potwierdzimy
          Twoją tożsamość linkiem wysłanym emailem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatedAlert show={ballot.notice !== null}>
          {ballot.notice}
        </AnimatedAlert>
        <AnimatedAlert show={ballot.error !== null} variant="destructive">
          {ballot.error}
        </AnimatedAlert>
        <ViewTransition view={ballot.stage}>
          {ballot.stage === 'answer' && (
            <BallotAnswerStep
              questions={questions}
              answers={ballot.answers}
              apartmentCount={apartmentCount}
              isComplete={ballot.isComplete}
              pending={ballot.pending}
              onChoose={ballot.choose}
              onSubmit={ballot.sendLink}
            />
          )}
          {ballot.stage === 'sent' && (
            <BallotSentStep
              pending={ballot.pending}
              onResend={ballot.sendLink}
              onBack={ballot.backToAnswers}
            />
          )}
        </ViewTransition>
      </CardContent>
    </Card>
  );
}
