import { ArrowRight, BarChart3, CheckCircle2, Vote } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VotingDeadline } from '@/components/votings/voting-deadline';
import { VotingStatusBadge } from '@/components/votings/voting-status-badge';
import type { TenantVotingDto } from '@/lib/voting/dto/tenant-voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import { VotingStatus } from '@/lib/voting/types/voting';

interface Props {
  voting: TenantVotingDto;
}

function Action({ voting }: Props) {
  if (voting.status === VotingStatus.RESULTS_PUBLISHED) {
    return (
      <>
        <BarChart3 />
        Zobacz wyniki
      </>
    );
  }

  return voting.awaitingVote ? (
    <>
      <Vote />
      Zagłosuj
    </>
  ) : (
    <>
      <CheckCircle2 />
      Zobacz głosowanie
    </>
  );
}

export function TenantVotingCard({ voting }: Props) {
  return (
    <Card className={voting.awaitingVote ? 'border-primary/50' : undefined}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <VotingStatusBadge status={voting.status} />
          {voting.awaitingVote && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Czeka na Twój głos
            </span>
          )}
        </div>
        <CardTitle className="text-lg leading-snug">{voting.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{voting.hoaName}</p>
        <VotingDeadline endsAt={voting.endsAt} />
        {voting.status === VotingStatus.ACTIVE && (
          <p className="text-sm text-muted-foreground">
            Oddane głosy: {voting.votedApartmentCount} z {voting.apartmentCount}{' '}
            Twoich lokali
          </p>
        )}
        <Button
          asChild
          variant={voting.awaitingVote ? 'default' : 'outline'}
          size="sm"
        >
          <Link href={`${VOTING_PATHS.tenant}/${voting.id}`}>
            <Action voting={voting} />
            <ArrowRight className="ml-auto" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
