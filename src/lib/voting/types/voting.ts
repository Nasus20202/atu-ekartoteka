import { VoteChoice, VotingStatus } from '@/generated/prisma/enums';

export { VoteChoice, VotingStatus };

/** One answer per question id. */
export type VoteAnswers = Record<string, VoteChoice>;

/** The answers of each apartment, by apartment id; apartments vote separately. */
export type BallotAnswers = Record<string, VoteAnswers>;

export interface VotingQuestionInput {
  text: string;
}

/** A voting as an admin submits it, after parsing. */
export interface VotingInput {
  hoaId: string;
  title: string;
  description: string | null;
  endsAt: Date | null;
  allowAbstain: boolean;
  questions: VotingQuestionInput[];
}

/** One apartment's answers in words, as the confirmation email lists them. */
export interface BallotSummary {
  apartment: string;
  answers: { question: string; answer: string }[];
}
