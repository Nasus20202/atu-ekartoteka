import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import type { VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

export interface OwnBallotSource {
  id: string;
  userId: string | null;
  apartment: {
    address: string | null;
    building: string | null;
    number: string;
  };
  votes: { questionId: string; choice: VoteChoice }[];
}

/** One apartment's answers, with the label of the apartment. */
export interface ApartmentBallotDto {
  apartmentId: string;
  apartment: string;
  answers: VoteAnswers;
}

export interface OwnBallotDto {
  id: string;
  apartment: string;
  /** Cast at a meeting and entered by an admin */
  fromMeeting: boolean;
  answers: VoteAnswers;
}

export function toOwnBallotDto(ballot: OwnBallotSource): OwnBallotDto {
  return {
    id: ballot.id,
    apartment: formatApartmentLabel(ballot.apartment),
    fromMeeting: ballot.userId === null,
    answers: Object.fromEntries(
      ballot.votes.map((vote) => [vote.questionId, vote.choice])
    ),
  };
}
