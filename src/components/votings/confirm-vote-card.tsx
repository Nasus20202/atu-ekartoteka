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
import { RecordedAnswers } from '@/components/votings/recorded-answers';
import { useConfirmVote } from '@/components/votings/use-confirm-vote';
import type { ApartmentBallotDto } from '@/lib/voting/dto/own-ballot-dto';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import { savedVoteSentence } from '@/lib/voting/rules/voting-wording';

interface Props {
  token: string;
  votingTitle: string;
  questions: VotingQuestionDto[];
  ballots: ApartmentBallotDto[];
}

export function ConfirmVoteCard({
  token,
  votingTitle,
  questions,
  ballots,
}: Props) {
  const vote = useConfirmVote(token);
  const done = vote.castCount !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{votingTitle}</CardTitle>
        <CardDescription>
          Sprawdź swoje odpowiedzi i potwierdź głos. Po potwierdzeniu nie można
          go zmienić.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatedAlert show={vote.error !== null} variant="destructive">
          {vote.error}
        </AnimatedAlert>
        <ViewTransition view={done ? 'done' : 'review'}>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden />
              <p className="text-lg font-semibold">Dziękujemy, głos oddany</p>
              <p className="text-sm text-muted-foreground">
                {savedVoteSentence(vote.castCount ?? 0)}
              </p>
              <Button asChild variant="outline">
                <Link href={VOTING_PATHS.tenant}>Wróć do głosowań</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ballots.map((ballot) => (
                <section key={ballot.apartmentId} className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    Lokal {ballot.apartment}
                  </h3>
                  <RecordedAnswers
                    questions={questions}
                    answers={ballot.answers}
                  />
                </section>
              ))}
              <Button disabled={vote.pending} onClick={vote.confirm}>
                Potwierdź i zagłosuj
              </Button>
            </div>
          )}
        </ViewTransition>
      </CardContent>
    </Card>
  );
}
