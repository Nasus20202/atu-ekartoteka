import { notFound } from 'next/navigation';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OwnAnswersCard } from '@/components/votings/own-answers-card';
import { VotingBallot } from '@/components/votings/voting-ballot';
import { VotingSummaryCard } from '@/components/votings/voting-summary-card';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import { toOwnBallotDto } from '@/lib/voting/dto/own-ballot-dto';
import { toVotingDto } from '@/lib/voting/dto/voting-dto';
import { findTenantVoting } from '@/lib/voting/queries/find-tenant-votings';
import {
  countVoterApartments,
  findOwnBallots,
  findVotableApartments,
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
  const [owned, votable] = await Promise.all([
    countVoterApartments(userId, voting.hoaId),
    findVotableApartments(userId, voting.hoaId, votingId),
  ]);
  const waiting = votable.map(({ id, ...apartment }) => ({
    id,
    label: formatApartmentLabel(apartment),
  }));

  // Results are for admins: a tenant sees the state and their own answers
  const closed = voting.status === VotingStatus.CLOSED;
  const own =
    waiting.length < owned
      ? (await findOwnBallots(userId, votingId)).map(toOwnBallotDto)
      : [];

  const open = isVotingOpen(found, now);

  return (
    <div className={`space-y-6 ${REVEAL_CLASS}`}>
      <VotingSummaryCard
        voting={voting}
        deadlinePassed={voting.status === VotingStatus.ACTIVE && !open}
      />
      {closed && (
        <Alert>
          <AlertDescription>
            Głosowanie zostało zakończone. Nie można już oddać głosu.
          </AlertDescription>
        </Alert>
      )}
      {own.map((ballot) => (
        <OwnAnswersCard
          key={ballot.id}
          questions={voting.questions}
          ballot={ballot}
        />
      ))}
      {open && waiting.length > 0 && (
        <VotingBallot
          votingId={voting.id}
          questions={voting.questions}
          allowAbstain={voting.allowAbstain}
          apartments={waiting}
          severalOwned={owned > 1}
        />
      )}
      {!closed && !open && (
        <Alert>
          <AlertDescription>
            Termin głosowania minął, więc nie można już oddać głosu.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
