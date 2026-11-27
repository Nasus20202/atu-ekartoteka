import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { ChoicePicker } from '@/components/votings/choice-picker';
import { cn } from '@/lib/shared/utils';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import type { VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

interface Props {
  apartment: { id: string; label: string };
  /** Shows which apartment the questions are for */
  named: boolean;
  questions: VotingQuestionDto[];
  choices: VoteChoice[];
  answers: Partial<VoteAnswers>;
  /** Some questions are answered but not all, while other apartments exist */
  unfinished: boolean;
  disabled: boolean;
  onChoose: (questionId: string, choice: VoteChoice) => void;
  onClear: () => void;
}

/** The questions as one apartment answers them. */
export function ApartmentAnswers({
  apartment,
  named,
  questions,
  choices,
  answers,
  unfinished,
  disabled,
  onChoose,
  onClear,
}: Props) {
  const heading = `ballot-${apartment.id}`;

  return (
    <section
      aria-labelledby={named ? heading : undefined}
      className={cn('space-y-6', named && 'rounded-xl border p-4')}
    >
      {named && (
        <h3 id={heading} className="font-semibold">
          Lokal {apartment.label}
        </h3>
      )}
      {questions.map((question, index) => (
        <ChoicePicker
          key={question.id}
          name={`question-${apartment.id}-${question.id}`}
          legend={`${index + 1}. ${question.text}`}
          choices={choices}
          value={answers[question.id]}
          disabled={disabled}
          onChange={(choice) => onChoose(question.id, choice)}
        />
      ))}
      <AnimatedAlert show={unfinished}>
        <span className="flex flex-wrap items-center justify-between gap-2">
          Odpowiedz na wszystkie pytania albo wyczyść ten lokal.
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={onClear}
          >
            Wyczyść
          </Button>
        </span>
      </AnimatedAlert>
    </section>
  );
}
