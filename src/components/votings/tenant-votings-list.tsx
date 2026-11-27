import { ListChecks } from 'lucide-react';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { TenantVotingCard } from '@/components/votings/tenant-voting-card';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getRequestNow } from '@/lib/framework/request-now';
import { toTenantVotingDto } from '@/lib/voting/dto/tenant-voting-dto';
import { findTenantVotings } from '@/lib/voting/queries/find-tenant-votings';
import { VotingStatus } from '@/lib/voting/types/voting';

const SECTIONS = [
  { status: VotingStatus.ACTIVE, title: 'Aktywne głosowania' },
  { status: VotingStatus.CLOSED, title: 'Zakończone głosowania' },
] as const;

export async function TenantVotingsList() {
  const { userId } = await requireApprovedTenant();
  const now = await getRequestNow();

  const sections = await Promise.all(
    SECTIONS.map(async ({ status, title }) => ({
      title,
      votings: (await findTenantVotings(userId, [status])).map((voting) =>
        toTenantVotingDto(voting, now)
      ),
    }))
  );

  if (sections.every((section) => section.votings.length === 0)) {
    return (
      <Card className={REVEAL_CLASS}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Brak głosowań</p>
          <p className="text-sm text-muted-foreground">
            Gdy administrator uruchomi głosowanie w Twojej wspólnocie, zobaczysz
            je tutaj.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-8 ${REVEAL_CLASS}`}>
      {sections.map(
        ({ title, votings }) =>
          votings.length > 0 && (
            <section key={title} className="space-y-3">
              <h2 className="text-xl font-semibold">{title}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {votings.map((voting) => (
                  <TenantVotingCard key={voting.id} voting={voting} />
                ))}
              </div>
            </section>
          )
      )}
    </div>
  );
}
