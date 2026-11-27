import { toIsoString } from '@/lib/shared/iso-string';
import type { VoteChoice, VotingStatus } from '@/lib/voting/types/voting';

export interface VotingQuestionDto {
  id: string;
  position: number;
  text: string;
}

const UNKNOWN_OWNER = 'Brak danych o właścicielu';

export interface VotingListItemSource {
  id: string;
  title: string;
  status: VotingStatus;
  endsAt: Date | null;
  createdAt: Date;
  hoa: { id: string; name: string };
  _count: { questions: number; ballots: number };
}

export interface VotingListItemDto {
  id: string;
  title: string;
  status: VotingStatus;
  endsAt: string | null;
  createdAt: string;
  hoaId: string;
  hoaName: string;
  questionCount: number;
  ballotCount: number;
}

export function toVotingListItemDto(
  voting: VotingListItemSource
): VotingListItemDto {
  return {
    id: voting.id,
    title: voting.title,
    status: voting.status,
    endsAt: voting.endsAt ? toIsoString(voting.endsAt) : null,
    createdAt: toIsoString(voting.createdAt),
    hoaId: voting.hoa.id,
    hoaName: voting.hoa.name,
    questionCount: voting._count.questions,
    ballotCount: voting._count.ballots,
  };
}

export interface VotingSource {
  id: string;
  title: string;
  description: string | null;
  status: VotingStatus;
  endsAt: Date | null;
  allowAbstain: boolean;
  hoa: { id: string; name: string };
  questions: VotingQuestionDto[];
}

export interface VotingDto {
  id: string;
  title: string;
  description: string | null;
  status: VotingStatus;
  endsAt: string | null;
  allowAbstain: boolean;
  hoaId: string;
  hoaName: string;
  questions: VotingQuestionDto[];
}

export function toVotingDto(voting: VotingSource): VotingDto {
  return {
    id: voting.id,
    title: voting.title,
    description: voting.description,
    status: voting.status,
    endsAt: voting.endsAt ? toIsoString(voting.endsAt) : null,
    allowAbstain: voting.allowAbstain,
    hoaId: voting.hoa.id,
    hoaName: voting.hoa.name,
    questions: voting.questions.map(({ id, position, text }) => ({
      id,
      position,
      text,
    })),
  };
}

export type ChoiceCounts = Record<VoteChoice, number>;

export interface QuestionResultDto {
  questionId: string;
  text: string;
  counts: ChoiceCounts;
  total: number;
}

export interface VoteCountRow {
  questionId: string;
  choice: VoteChoice;
  count: number;
}

/** Folds the grouped counts into one result per question, in question order. */
export function toQuestionResults(
  questions: VotingQuestionDto[],
  rows: VoteCountRow[]
): QuestionResultDto[] {
  return questions.map((question) => {
    const counts: ChoiceCounts = { FOR: 0, AGAINST: 0, ABSTAIN: 0 };

    for (const row of rows) {
      if (row.questionId === question.id) counts[row.choice] += row.count;
    }

    return {
      questionId: question.id,
      text: question.text,
      counts,
      total: counts.FOR + counts.AGAINST + counts.ABSTAIN,
    };
  });
}

export interface VoterSource {
  id: string;
  createdAt: Date;
  /** Null for a ballot cast at a meeting */
  user: { name: string | null; email: string } | null;
  apartment: {
    owner: string | null;
    address: string | null;
    building: string | null;
    number: string;
  };
  votes: { questionId: string; choice: VoteChoice }[];
}

export interface VoterDto {
  ballotId: string;
  voterName: string;
  voterEmail: string | null;
  fromMeeting: boolean;
  apartment: {
    address: string | null;
    building: string | null;
    number: string;
  };
  votedAt: string;
  answers: Record<string, VoteChoice>;
}

export function toVoterDto(ballot: VoterSource): VoterDto {
  const { owner, ...apartment } = ballot.apartment;

  return {
    ballotId: ballot.id,
    voterName: ballot.user
      ? (ballot.user.name ?? ballot.user.email)
      : (owner ?? UNKNOWN_OWNER),
    voterEmail: ballot.user?.email ?? null,
    fromMeeting: ballot.user === null,
    apartment,
    votedAt: toIsoString(ballot.createdAt),
    answers: Object.fromEntries(
      ballot.votes.map((vote) => [vote.questionId, vote.choice])
    ),
  };
}
