'use client';

import { Archive, BarChart3, Pencil, Rocket, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { useVotingStatusActions } from '@/components/votings/use-voting-status-actions';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import { VotingStatus } from '@/lib/voting/types/voting';

interface Props {
  votingId: string;
  status: VotingStatus;
}

export function VotingStatusActions({ votingId, status }: Props) {
  const { pending, error, changeStatus, remove } =
    useVotingStatusActions(votingId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === VotingStatus.DRAFT && (
          <>
            <Button
              disabled={pending}
              onClick={() =>
                changeStatus(VotingStatus.ACTIVE, {
                  title: 'Opublikować głosowanie?',
                  description:
                    'Głosowanie stanie się widoczne dla właścicieli lokali we wspólnocie i nie będzie można go już edytować.',
                  confirmText: 'Opublikuj',
                })
              }
            >
              <Rocket />
              Opublikuj
            </Button>
            <Button asChild variant="outline">
              <Link href={`${VOTING_PATHS.admin}/${votingId}/edit`}>
                <Pencil />
                Edytuj
              </Link>
            </Button>
            <Button variant="outline" disabled={pending} onClick={remove}>
              <Trash2 />
              Usuń
            </Button>
          </>
        )}
        {status === VotingStatus.ACTIVE && (
          <Button
            disabled={pending}
            onClick={() =>
              changeStatus(VotingStatus.RESULTS_PUBLISHED, {
                title: 'Pokazać wyniki?',
                description:
                  'Głosowanie zostanie zakończone, a właściciele zobaczą zbiorcze wyniki (bez informacji, kto jak głosował).',
                confirmText: 'Pokaż wyniki',
              })
            }
          >
            <BarChart3 />
            Pokaż wyniki
          </Button>
        )}
        {(status === VotingStatus.ACTIVE ||
          status === VotingStatus.RESULTS_PUBLISHED) && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              changeStatus(VotingStatus.ARCHIVED, {
                title: 'Zarchiwizować głosowanie?',
                description:
                  'Głosowanie zniknie z widoku właścicieli. Wyniki pozostaną dostępne dla administratora.',
                confirmText: 'Zarchiwizuj',
              })
            }
          >
            <Archive />
            Zarchiwizuj
          </Button>
        )}
      </div>
      <AnimatedAlert show={error !== null} variant="destructive">
        {error}
      </AnimatedAlert>
    </div>
  );
}
