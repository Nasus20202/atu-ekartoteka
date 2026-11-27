import { Building2, Users } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VotingDeadline } from '@/components/votings/voting-deadline';
import { VotingStatusBadge } from '@/components/votings/voting-status-badge';
import type { VotingListItemDto } from '@/lib/voting/dto/voting-dto';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';

interface Props {
  votings: VotingListItemDto[];
}

export function AdminVotingCards({ votings }: Props) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {votings.map((voting) => (
        <li key={voting.id}>
          <Link
            href={`${VOTING_PATHS.admin}/${voting.id}`}
            className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full hover:border-primary/40">
              <CardHeader className="space-y-3 pb-3">
                <VotingStatusBadge status={voting.status} className="w-fit" />
                <CardTitle className="text-lg leading-snug">
                  {voting.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" aria-hidden />
                  {voting.hoaName}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden />
                  Pytania: {voting.questionCount} · Oddane głosy:{' '}
                  {voting.ballotCount}
                </p>
                <VotingDeadline endsAt={voting.endsAt} />
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
