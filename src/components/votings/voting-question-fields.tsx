import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuestionField } from '@/components/votings/use-voting-form';
import { MAX_QUESTION_LENGTH } from '@/lib/voting/rules/voting-constants';

interface Props {
  questions: QuestionField[];
  canAdd: boolean;
  canRemove: boolean;
  disabled: boolean;
  onAdd: () => void;
  onChange: (key: number, text: string) => void;
  onRemove: (key: number) => void;
  onMove: (key: number, offset: -1 | 1) => void;
}

export function VotingQuestionFields({
  questions,
  canAdd,
  canRemove,
  disabled,
  onAdd,
  onChange,
  onRemove,
  onMove,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Pytania</Label>
        <span className="text-xs text-muted-foreground">
          Odpowiedzi: Za, Przeciw, Wstrzymał(a) się
        </span>
      </div>
      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li
            key={question.key}
            className={`flex gap-2 rounded-lg border bg-muted/30 p-3 ${REVEAL_CLASS}`}
          >
            <span className="mt-2 w-6 text-sm font-semibold text-muted-foreground">
              {index + 1}.
            </span>
            <Textarea
              aria-label={`Treść pytania ${index + 1}`}
              value={question.text}
              maxLength={MAX_QUESTION_LENGTH}
              disabled={disabled}
              placeholder="Treść uchwały lub pytania"
              className="min-h-16 flex-1"
              onChange={(event) => onChange(question.key, event.target.value)}
            />
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Przesuń pytanie ${index + 1} w górę`}
                disabled={disabled || index === 0}
                onClick={() => onMove(question.key, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Przesuń pytanie ${index + 1} w dół`}
                disabled={disabled || index === questions.length - 1}
                onClick={() => onMove(question.key, 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Usuń pytanie ${index + 1}`}
                disabled={disabled || !canRemove}
                onClick={() => onRemove(question.key)}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !canAdd}
        onClick={onAdd}
      >
        <Plus />
        Dodaj pytanie
      </Button>
    </div>
  );
}
