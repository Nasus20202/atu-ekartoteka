'use client';

import { useState } from 'react';

import { notifyVotersAction } from '@/actions/voting/admin-votings';
import type { EligibleVoterDto } from '@/lib/voting/dto/eligible-voter-dto';

const FAILURE = 'Nie udało się wysłać powiadomień';

export type NotifyOutcome =
  | { kind: 'sent'; sent: number; failed: number }
  | { kind: 'error'; message: string }
  | null;

export function useNotifyVoters(votingId: string, voters: EligibleVoterDto[]) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<NotifyOutcome>(null);

  function openDialog() {
    setSelected(new Set(voters.filter((v) => !v.hasVoted).map((v) => v.id)));
    setOutcome(null);
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(voters.map((voter) => voter.id)));
  }

  function selectPending() {
    setSelected(new Set(voters.filter((v) => !v.hasVoted).map((v) => v.id)));
  }

  async function send() {
    setSending(true);
    setOutcome(null);

    try {
      const result = await notifyVotersAction({
        votingId,
        userIds: [...selected],
      });

      setOutcome(
        result.ok
          ? { kind: 'sent', ...result.data }
          : { kind: 'error', message: result.error || FAILURE }
      );
    } catch {
      setOutcome({ kind: 'error', message: FAILURE });
    } finally {
      setSending(false);
    }
  }

  return {
    open,
    setOpen,
    openDialog,
    selected,
    toggle,
    selectAll,
    selectPending,
    sending,
    outcome,
    send,
  } as const;
}
