'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ViewTransition } from '@/components/ui/view-transition';
import { BallotAnswerStep } from '@/components/votings/ballot-answer-step';
import { BallotCodeStep } from '@/components/votings/ballot-code-step';
import { useBallot } from '@/components/votings/use-ballot';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';

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
          Twoją tożsamość kodem wysłanym emailem.
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
              onSubmit={ballot.requestCode}
            />
          )}
          {ballot.stage === 'code' && (
            <BallotCodeStep
              code={ballot.code}
              pending={ballot.pending}
              onCodeChange={ballot.setCode}
              onConfirm={ballot.confirm}
              onResend={ballot.requestCode}
              onBack={ballot.backToAnswers}
            />
          )}
          {ballot.stage === 'done' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden />
              <p className="text-lg font-semibold">Dziękujemy, głos oddany</p>
              <p className="text-sm text-muted-foreground">
                Zapisaliśmy głosy dla lokali: {ballot.castCount}.
              </p>
              <Button asChild variant="outline">
                <Link href={VOTING_PATHS.tenant}>Wróć do głosowań</Link>
              </Button>
            </div>
          )}
        </ViewTransition>
      </CardContent>
    </Card>
  );
}
