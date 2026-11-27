import { Building2, ListChecks, Users } from 'lucide-react';
import Link from 'next/link';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VotingDeadline } from '@/components/votings/voting-deadline';
import { VotingStatusBadge } from '@/components/votings/voting-status-badge';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { toVotingListItemDto } from '@/lib/voting/dto/voting-dto';
import { findAdminVotings } from '@/lib/voting/queries/find-admin-votings';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';

export async function AdminVotingsList() {
  await requireAdminAccess();

  const votings = (await findAdminVotings()).map(toVotingListItemDto);

  if (votings.length === 0) {
    return (
      <Card className={REVEAL_CLASS}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Brak głosowań</p>
          <p className="text-sm text-muted-foreground">
            Utwórz pierwsze głosowanie dla wybranej wspólnoty.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className={`grid gap-4 md:grid-cols-2 ${REVEAL_CLASS}`}>
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
