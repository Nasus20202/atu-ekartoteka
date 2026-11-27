import { notFound } from 'next/navigation';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MeetingBallotsCard } from '@/components/votings/meeting-ballots-card';
import { NotifyVotersDialog } from '@/components/votings/notify-voters-dialog';
import { VotingResults } from '@/components/votings/voting-results';
import { VotingStatusActions } from '@/components/votings/voting-status-actions';
import { VotingSummaryCard } from '@/components/votings/voting-summary-card';
import { VotingVotersTable } from '@/components/votings/voting-voters-table';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { getRequestNow } from '@/lib/framework/request-now';
import { toEligibleVoterDto } from '@/lib/voting/dto/eligible-voter-dto';
import {
  toQuestionResults,
  toVoterDto,
  toVotingDto,
} from '@/lib/voting/dto/voting-dto';
import { countVotingApartments } from '@/lib/voting/queries/count-voting-apartments';
import { countVotingResults } from '@/lib/voting/queries/count-voting-results';
import { findEligibleVoters } from '@/lib/voting/queries/find-eligible-voters';
import { findVotingBallots } from '@/lib/voting/queries/find-voting-ballots';
import { findVotingById } from '@/lib/voting/queries/find-voting-by-id';
import { choicePercent } from '@/lib/voting/rules/results';
import { isVotingOpen, voteChoices } from '@/lib/voting/rules/voting-status';
import { VotingStatus } from '@/lib/voting/types/voting';

interface Props {
  votingId: string;
}

export async function AdminVotingDetail({ votingId }: Props) {
  await requireAdminAccess();

  const found = await findVotingById(votingId);
  if (!found) notFound();

  const voting = toVotingDto(found);
  const [counts, ballots, eligible, apartmentTotal, now] = await Promise.all([
    countVotingResults(votingId),
    findVotingBallots(votingId),
    findEligibleVoters(voting.hoaId, votingId),
    countVotingApartments(voting.hoaId),
    getRequestNow(),
  ]);

  const voters = eligible.map(toEligibleVoterDto);
  const isDraft = voting.status === VotingStatus.DRAFT;
  const canNotify = isVotingOpen(
    { status: voting.status, endsAt: found.endsAt },
    now
  );

  return (
    <div className={`space-y-6 ${REVEAL_CLASS}`}>
      <VotingSummaryCard
        voting={voting}
        deadlinePassed={voting.status === VotingStatus.ACTIVE && !canNotify}
        stats={[
          { label: 'Oddane głosy', value: String(ballots.length) },
          { label: 'Uprawnione lokale', value: String(apartmentTotal) },
          {
            label: 'Frekwencja',
            value: `${choicePercent(ballots.length, apartmentTotal)}%`,
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <VotingStatusActions votingId={voting.id} status={voting.status} />
            {canNotify && (
              <NotifyVotersDialog votingId={voting.id} voters={voters} />
            )}
          </div>
        }
      />

      {isDraft ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pytania</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5">
                {voting.questions.map((question) => (
                  <li key={question.id}>{question.text}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <MeetingBallotsCard
            votingId={voting.id}
            questions={voting.questions}
            choices={voteChoices(voting.allowAbstain)}
            ballots={ballots.map(toVoterDto)}
          />
        </>
      ) : (
        <Tabs defaultValue="results">
          <TabsList>
            <TabsTrigger value="results">Wyniki</TabsTrigger>
            <TabsTrigger value="voters">Oddane głosy</TabsTrigger>
          </TabsList>
          <TabsContent value="results">
            <VotingResults
              results={toQuestionResults(voting.questions, counts)}
              choices={voteChoices(voting.allowAbstain)}
            />
          </TabsContent>
          <TabsContent value="voters">
            <VotingVotersTable
              voters={ballots.map(toVoterDto)}
              questions={voting.questions}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
