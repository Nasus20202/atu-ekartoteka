import Link from 'next/link';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmVoteCard } from '@/components/votings/confirm-vote-card';
import type { ApartmentBallotDto } from '@/lib/voting/dto/own-ballot-dto';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';

/** What the owner confirms: the voting and the answers stored with the link. */
export interface ConfirmableVote {
  token: string;
  votingTitle: string;
  questions: VotingQuestionDto[];
  ballots: ApartmentBallotDto[];
}

interface Props {
  /** Null when the link cannot be used; the reason is decided by the caller. */
  link: ConfirmableVote | null;
}

function Unusable() {
  return (
    <div className={`space-y-4 ${REVEAL_CLASS}`}>
      <Alert variant="destructive">
        <AlertDescription>
          Ten link jest nieprawidłowy, wygasł, został już użyty albo głosowanie
          jest zakończone. Wróć do głosowania i poproś o nowy link.
        </AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link href={VOTING_PATHS.tenant}>Wróć do głosowań</Link>
      </Button>
    </div>
  );
}

export function VoteConfirmationView({ link }: Props) {
  if (!link) return <Unusable />;

  return (
    <div className={REVEAL_CLASS}>
      <ConfirmVoteCard
        token={link.token}
        votingTitle={link.votingTitle}
        questions={link.questions}
        ballots={link.ballots}
      />
    </div>
  );
}
