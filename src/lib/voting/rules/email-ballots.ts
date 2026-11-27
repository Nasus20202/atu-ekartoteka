import {
  formatApartmentLabel,
  type LabelledApartment,
} from '@/lib/shared/utils/apartment-label';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import type { BallotAnswers, BallotSummary } from '@/lib/voting/types/voting';

/** The answers of each voting apartment, in words, for the confirmation email. */
export function toEmailBallots(
  apartments: (LabelledApartment & { id: string })[],
  questions: { id: string; text: string }[],
  answers: BallotAnswers
): BallotSummary[] {
  return apartments
    .filter((apartment) => apartment.id in answers)
    .map((apartment) => ({
      apartment: formatApartmentLabel(apartment),
      answers: questions.map((question) => ({
        question: question.text,
        answer: VOTE_CHOICE_LABELS[answers[apartment.id][question.id]],
      })),
    }));
}
