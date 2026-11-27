import { Building2 } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { VotingDeadline } from '@/components/votings/voting-deadline';
import { VotingStatusBadge } from '@/components/votings/voting-status-badge';
import type { VotingDto } from '@/lib/voting/dto/voting-dto';

interface Stat {
  label: string;
  value: string;
}

interface Props {
  voting: VotingDto;
  /** The deadline passed while the voting was still active. */
  deadlinePassed?: boolean;
  stats?: Stat[];
  actions?: ReactNode;
}

export function VotingSummaryCard({
  voting,
  deadlinePassed,
  stats = [],
  actions,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle role="heading" aria-level={2} className="text-xl">
            {voting.title}
          </CardTitle>
          <VotingStatusBadge status={voting.status} />
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" aria-hidden />
            {voting.hoaName}
          </span>
          <VotingDeadline endsAt={voting.endsAt} passed={deadlinePassed} />
        </CardDescription>
      </CardHeader>
      {(voting.description || stats.length > 0 || actions) && (
        <CardContent className="space-y-5">
          {voting.description && (
            <p className="whitespace-pre-line text-sm">{voting.description}</p>
          )}
          {stats.length > 0 && (
            <dl className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-muted/50 p-3">
                  <dt className="text-xs text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="text-xl font-semibold tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {actions}
        </CardContent>
      )}
    </Card>
  );
}
