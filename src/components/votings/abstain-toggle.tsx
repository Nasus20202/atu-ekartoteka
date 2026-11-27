import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import { VoteChoice } from '@/lib/voting/types/voting';

const ID = 'voting-block-abstain';

interface Props {
  blocked: boolean;
  disabled: boolean;
  onChange: (blocked: boolean) => void;
}

/** Lets the admin remove abstaining from the answers of the whole voting. */
export function AbstainToggle({ blocked, disabled, onChange }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Checkbox
        id={ID}
        className="mt-0.5"
        checked={blocked}
        disabled={disabled}
        aria-describedby={`${ID}-hint`}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <div className="space-y-1">
        <Label htmlFor={ID} className="cursor-pointer leading-snug">
          Zablokuj odpowiedź „{VOTE_CHOICE_LABELS[VoteChoice.ABSTAIN]}”
        </Label>
        <p id={`${ID}-hint`} className="text-xs text-muted-foreground">
          Dotyczy wszystkich pytań: głosujący wybierają tylko „
          {VOTE_CHOICE_LABELS[VoteChoice.FOR]}” albo „
          {VOTE_CHOICE_LABELS[VoteChoice.AGAINST]}”.
        </p>
      </div>
    </div>
  );
}
