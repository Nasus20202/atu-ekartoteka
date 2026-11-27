import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ViewTransition } from '@/components/ui/view-transition';
import { AnswerChips } from '@/components/votings/answer-chips';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import type { VoterDto, VotingQuestionDto } from '@/lib/voting/dto/voting-dto';

interface Props {
  ballots: VoterDto[];
  questions: VotingQuestionDto[];
  disabled: boolean;
  onRemove: (ballotId: string, apartment: string) => void;
}

export function MeetingBallotList({
  ballots,
  questions,
  disabled,
  onRemove,
}: Props) {
  return (
    <ViewTransition view={ballots.map((b) => b.ballotId).join()}>
      <h3 className="mb-2 text-sm font-semibold">
        Wpisane głosy: {ballots.length}
      </h3>
      {ballots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nie wpisano jeszcze żadnego głosu z zebrania.
        </p>
      ) : (
        <ul aria-label="Wpisane głosy" className="divide-y rounded-lg border">
          {ballots.map((ballot) => {
            const label = formatApartmentLabel(ballot.apartment);

            return (
              <li
                key={ballot.ballotId}
                className="flex items-start justify-between gap-3 p-3"
              >
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      – {ballot.voterName}
                    </span>
                  </p>
                  <AnswerChips answers={ballot.answers} questions={questions} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={`Usuń głos za lokal ${label}`}
                  disabled={disabled}
                  onClick={() => onRemove(ballot.ballotId, label)}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </ViewTransition>
  );
}
