import { toIsoString } from '@/lib/shared/iso-string';
import { isVotingOpen } from '@/lib/voting/rules/voting-status';
import type { VotingStatus } from '@/lib/voting/types/voting';

export interface TenantVotingSource {
  id: string;
  title: string;
  status: VotingStatus;
  endsAt: Date | null;
  hoa: { name: string; _count: { apartments: number } };
  _count: { questions: number; ballots: number };
}

export interface TenantVotingDto {
  id: string;
  title: string;
  status: VotingStatus;
  endsAt: string | null;
  hoaName: string;
  questionCount: number;
  apartmentCount: number;
  votedApartmentCount: number;
  /** Active and before its deadline: ballots are still accepted. */
  open: boolean;
  /** An open voting in which at least one of the user's apartments has not voted. */
  awaitingVote: boolean;
}

export function toTenantVotingDto(
  voting: TenantVotingSource,
  now: Date
): TenantVotingDto {
  const apartmentCount = voting.hoa._count.apartments;
  const votedApartmentCount = voting._count.ballots;
  const open = isVotingOpen(voting, now);

  return {
    id: voting.id,
    title: voting.title,
    status: voting.status,
    endsAt: voting.endsAt ? toIsoString(voting.endsAt) : null,
    hoaName: voting.hoa.name,
    questionCount: voting._count.questions,
    apartmentCount,
    votedApartmentCount,
    open,
    awaitingVote: open && votedApartmentCount < apartmentCount,
  };
}
