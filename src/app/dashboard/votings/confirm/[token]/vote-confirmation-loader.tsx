import { VoteConfirmationView } from '@/components/votings/vote-confirmation-view';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { votingMetrics } from '@/lib/platform/opentelemetry/voting-metrics';
import {
  linkRejectionMetric,
  resolveVoteLink,
  type VoteLinkRejection,
} from '@/lib/voting/use-cases/resolve-vote-link';

interface Props {
  token: string;
}

// Opening a refused link is a confirmation step too, so it is counted with the
// same reasons as confirmVote; this page only shows the refusal.
function countRefusal(rejection: VoteLinkRejection) {
  const reason = linkRejectionMetric(rejection);
  if (reason) votingMetrics.recordConfirmation({ result: 'rejected', reason });
}

/** Streams inside the page's Suspense: checks the owner's link and shows it. */
export async function VoteConfirmationLoader({ token }: Props) {
  const { userId } = await requireApprovedTenant();
  const now = await getRequestNow();
  const resolved = await resolveVoteLink({ userId, token, now });

  if (!resolved.ok) {
    countRefusal(resolved.rejection);
    return <VoteConfirmationView link={null} />;
  }

  const { link } = resolved;
  return (
    <VoteConfirmationView
      link={{
        token,
        votingTitle: link.voting.title,
        questions: link.voting.questions,
        ballots: link.ballots,
      }}
    />
  );
}
