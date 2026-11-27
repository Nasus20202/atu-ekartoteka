import type { VotingInput } from '@/lib/voting/types/voting';

export interface LockedContent {
  hoaId: string;
  allowAbstain: boolean;
  questions: { text: string }[];
}

/**
 * Whether the input changes what the entered ballots answer: the association,
 * the accepted answers or the questions.
 */
export function changesBallotContent(
  current: LockedContent,
  input: VotingInput
): boolean {
  return (
    current.hoaId !== input.hoaId ||
    current.allowAbstain !== input.allowAbstain ||
    current.questions.length !== input.questions.length ||
    current.questions.some(
      (question, index) => question.text !== input.questions[index].text
    )
  );
}
