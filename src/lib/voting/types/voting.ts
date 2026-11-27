import { VoteChoice, VotingStatus } from '@/generated/prisma/enums';

export { VoteChoice, VotingStatus };

/** One answer per question id. */
export type VoteAnswers = Record<string, VoteChoice>;

export interface VotingQuestionInput {
  text: string;
}

/** A voting as an admin submits it, after parsing. */
export interface VotingInput {
  hoaId: string;
  title: string;
  description: string | null;
  endsAt: Date | null;
  questions: VotingQuestionInput[];
}
