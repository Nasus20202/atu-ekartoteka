import { notFound } from 'next/navigation';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OwnAnswersCard } from '@/components/votings/own-answers-card';
import { VotingBallot } from '@/components/votings/voting-ballot';
import { VotingResults } from '@/components/votings/voting-results';
import { VotingSummaryCard } from '@/components/votings/voting-summary-card';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { toQuestionResults, toVotingDto } from '@/lib/voting/dto/voting-dto';
import { countVotingResults } from '@/lib/voting/queries/count-voting-results';
import { findTenantVoting } from '@/lib/voting/queries/find-tenant-votings';
import {
  findOwnBallot,
  findVoterApartments,
} from '@/lib/voting/queries/find-voter-apartments';
import { isVotingOpen } from '@/lib/voting/rules/voting-status';
import { VotingStatus } from '@/lib/voting/types/voting';

interface Props {
  votingId: string;
}

export async function TenantVotingDetail({ votingId }: Props) {
  const { userId } = await requireApprovedTenant();

  const found = await findTenantVoting(userId, votingId);
  if (!found) notFound();

  const voting = toVotingDto(found);
  const now = await getRequestNow();
  const apartments = await findVoterApartments(userId, voting.hoaId, votingId);
  const waiting = apartments.reduce(
    (count, apartment) =>
      count + (apartment.votingBallots.length === 0 ? 1 : 0),
    0
  );

  const showResults = voting.status === VotingStatus.RESULTS_PUBLISHED;
  const [counts, own] = await Promise.all([
    showResults ? countVotingResults(votingId) : [],
    waiting < apartments.length ? findOwnBallot(userId, votingId) : null,
  ]);

  const open = isVotingOpen(found, now);
  const ownAnswers = Object.fromEntries(
    (own?.votes ?? []).map((vote) => [vote.questionId, vote.choice])
  );

  return (
    <div className={`space-y-6 ${REVEAL_CLASS}`}>
      <VotingSummaryCard voting={voting} />
      {showResults && (
        <VotingResults results={toQuestionResults(voting.questions, counts)} />
      )}
      {!showResults && own && (
        <OwnAnswersCard questions={voting.questions} answers={ownAnswers} />
      )}
      {!showResults && open && waiting > 0 && (
        <VotingBallot
          votingId={voting.id}
          questions={voting.questions}
          apartmentCount={waiting}
        />
      )}
      {!showResults && !open && (
        <Alert>
          <AlertDescription>
            To głosowanie zostało zakończone. Wyniki pojawią się, gdy
            administrator je opublikuje.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
