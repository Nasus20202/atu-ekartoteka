import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/shared/utils';
import type { QuestionResultDto } from '@/lib/voting/dto/voting-dto';
import { choicePercent } from '@/lib/voting/rules/results';
import {
  VOTE_CHOICE_LABELS,
  VOTE_CHOICES,
} from '@/lib/voting/rules/voting-status';
import { VoteChoice } from '@/lib/voting/types/voting';

const BAR_CLASSES: Record<VoteChoice, string> = {
  [VoteChoice.FOR]: 'bg-green-500 dark:bg-green-500',
  [VoteChoice.AGAINST]: 'bg-red-500 dark:bg-red-500',
  [VoteChoice.ABSTAIN]: 'bg-slate-400 dark:bg-slate-500',
};

interface Props {
  results: QuestionResultDto[];
}

export function VotingResults({ results }: Props) {
  return (
    <div className={cn('space-y-4', REVEAL_CLASS)}>
      {results.map((result, index) => (
        <Card key={result.questionId}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <span className="mr-2 text-muted-foreground">{index + 1}.</span>
              {result.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {VOTE_CHOICES.map((choice) => {
              const count = result.counts[choice];
              const percent = choicePercent(count, result.total);

              return (
                <div key={choice} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {VOTE_CHOICE_LABELS[choice]}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${VOTE_CHOICE_LABELS[choice]}: ${percent}%`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none',
                        BAR_CLASSES[choice]
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-muted-foreground">
              Oddanych głosów: {result.total}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
