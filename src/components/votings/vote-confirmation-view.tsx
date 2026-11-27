import Link from 'next/link';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmVoteCard } from '@/components/votings/confirm-vote-card';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { toVotingDto } from '@/lib/voting/dto/voting-dto';
import { findTenantVoting } from '@/lib/voting/queries/find-tenant-votings';
import { findVoteConfirmationByToken } from '@/lib/voting/queries/find-vote-confirmation';
import {
  hashConfirmationToken,
  isConfirmationTokenFormat,
} from '@/lib/voting/rules/confirmation-token';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import { parseAnswers } from '@/lib/voting/rules/voting-input';
import { isVotingOpen } from '@/lib/voting/rules/voting-status';

interface Props {
  token: string;
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

export async function VoteConfirmationView({ token }: Props) {
  const { userId } = await requireApprovedTenant();
  const now = await getRequestNow();

  const pending = isConfirmationTokenFormat(token)
    ? await findVoteConfirmationByToken(hashConfirmationToken(token))
    : null;

  // Someone else's link is shown exactly like an unknown one
  if (!pending || pending.userId !== userId || pending.expiresAt <= now) {
    return <Unusable />;
  }

  const found = await findTenantVoting(userId, pending.votingId);
  if (!found || !isVotingOpen(found, now)) return <Unusable />;

  const voting = toVotingDto(found);
  const answers = parseAnswers(
    pending.answers,
    voting.questions.map((question) => question.id)
  );
  if (!answers.ok) return <Unusable />;

  return (
    <div className={REVEAL_CLASS}>
      <ConfirmVoteCard
        token={token}
        votingTitle={voting.title}
        questions={voting.questions}
        answers={answers.value}
      />
    </div>
  );
}
