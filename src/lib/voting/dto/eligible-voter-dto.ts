import { formatOwnedApartmentLabel } from '@/lib/shared/utils/apartment-label';

export interface EligibleVoterSource {
  id: string;
  name: string | null;
  email: string;
  apartments: {
    id: string;
    owner: string | null;
    address: string | null;
    building: string | null;
    number: string;
    /** The apartment's ballot in this voting, however it was cast */
    votingBallots: { id: string }[];
  }[];
}

export interface EligibleVoterDto {
  id: string;
  name: string;
  email: string;
  /** The voter's apartments in the association, each with its owner */
  apartments: { id: string; label: string }[];
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
    apartments: user.apartments.map((apartment) => ({
      id: apartment.id,
      label: formatOwnedApartmentLabel(apartment),
    })),
    hasVoted: user.apartments.every(
      (apartment) => apartment.votingBallots.length > 0
    ),
  };
}
