import { Vote } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { VotingStatusBadge } from '@/components/votings/voting-status-badge';
import type { TenantVotingDto } from '@/lib/voting/dto/tenant-voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import { awaitingVotesSentence } from '@/lib/voting/rules/voting-wording';

interface Props {
  votings: TenantVotingDto[];
}

export function VotingsCard({ votings }: Props) {
  const awaiting = votings.reduce(
    (count, voting) => count + (voting.awaitingVote ? 1 : 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5" aria-hidden />
          Głosowania
        </CardTitle>
        <CardDescription>
          {awaiting > 0
            ? awaitingVotesSentence(awaiting)
            : 'Oddałeś głosy we wszystkich aktywnych głosowaniach'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {votings.map((voting) => (
            <li
              key={voting.id}
              data-testid={`dashboard-voting-${voting.id}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{voting.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <VotingStatusBadge status={voting.status} />
                  <span className="truncate">{voting.hoaName}</span>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant={voting.awaitingVote ? 'default' : 'outline'}
              >
                <Link href={`${VOTING_PATHS.tenant}/${voting.id}`}>
                  {voting.awaitingVote ? 'Zagłosuj' : 'Zobacz'}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
