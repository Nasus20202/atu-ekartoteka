export interface EligibleVoterSource {
  id: string;
  name: string | null;
  email: string;
  _count: { apartments: number };
  votingBallots: { id: string }[];
}

export interface EligibleVoterDto {
  id: string;
  name: string;
  email: string;
  apartmentCount: number;
  /** True once every one of the voter's apartments has a ballot. */
  hasVoted: boolean;
}

export function toEligibleVoterDto(
  user: EligibleVoterSource
): EligibleVoterDto {
  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    apartmentCount: user._count.apartments,
    hasVoted: user.votingBallots.length >= user._count.apartments,
  };
}
