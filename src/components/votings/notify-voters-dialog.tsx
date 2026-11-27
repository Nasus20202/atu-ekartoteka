'use client';

import { Bell, Send } from 'lucide-react';

import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SuccessMessage } from '@/components/ui/success-message';
import { useNotifyVoters } from '@/components/votings/use-notify-voters';
import type { EligibleVoterDto } from '@/lib/voting/dto/eligible-voter-dto';

interface Props {
  votingId: string;
  voters: EligibleVoterDto[];
}

export function NotifyVotersDialog({ votingId, voters }: Props) {
  const notify = useNotifyVoters(votingId, voters);

  return (
    <>
      <Button variant="outline" onClick={notify.openDialog}>
        <Bell />
        Powiadom użytkowników
      </Button>
      <Dialog open={notify.open} onOpenChange={notify.setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Powiadom o głosowaniu</DialogTitle>
            <DialogDescription>
              Wybierz właścicieli, którzy dostaną wiadomość email z linkiem do
              głosowania. Domyślnie zaznaczeni są ci, którzy jeszcze nie
              głosowali.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={notify.selectPending}>
              Bez głosu
            </Button>
            <Button size="sm" variant="outline" onClick={notify.selectAll}>
              Wszyscy
            </Button>
          </div>
          <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
            {voters.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                Brak zatwierdzonych właścicieli lokali w tej wspólnocie.
              </li>
            )}
            {voters.map((voter) => (
              <li key={voter.id}>
                <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-accent/50">
                  <Checkbox
                    checked={notify.selected.has(voter.id)}
                    onCheckedChange={() => notify.toggle(voter.id)}
                    aria-label={voter.name}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {voter.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {voter.email}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {voter.hasVoted ? 'Zagłosował(a)' : 'Bez głosu'}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {notify.outcome?.kind === 'sent' && (
            <SuccessMessage>
              Wysłano: {notify.outcome.sent}
              {notify.outcome.failed > 0 &&
                `, nie udało się: ${notify.outcome.failed}`}
            </SuccessMessage>
          )}
          <AnimatedAlert
            show={notify.outcome?.kind === 'error'}
            variant="destructive"
          >
            {notify.outcome?.kind === 'error' ? notify.outcome.message : null}
          </AnimatedAlert>
          <DialogFooter>
            <Button
              disabled={notify.sending || notify.selected.size === 0}
              onClick={notify.send}
            >
              <Send />
              Wyślij ({notify.selected.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
