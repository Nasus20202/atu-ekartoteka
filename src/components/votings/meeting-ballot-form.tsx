import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { ChoicePicker } from '@/components/votings/choice-picker';
import type { useMeetingBallots } from '@/components/votings/use-meeting-ballots';
import type { VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import type { VoteChoice } from '@/lib/voting/types/voting';

const ID = 'meeting-ballot-apartment';

interface Props {
  form: ReturnType<typeof useMeetingBallots>;
  questions: VotingQuestionDto[];
  choices: VoteChoice[];
}

export function MeetingBallotForm({ form, questions, choices }: Props) {
  const { apartments, apartment } = form;

  return (
    <form
      className="space-y-5"
      aria-label="Nowy głos z zebrania"
      onSubmit={(event) => {
        event.preventDefault();
        void form.save();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={ID}>Lokal</Label>
        <Combobox
          id={ID}
          value={apartment?.id ?? ''}
          selectedLabel={apartment?.label ?? null}
          options={apartments.options.map(({ id, label }) => ({
            value: id,
            label,
          }))}
          search={apartments.search}
          busy={apartments.pending}
          disabled={form.pending}
          onSearchChange={apartments.setSearch}
          onValueChange={form.chooseApartment}
          placeholder="Wybierz lokal"
          searchLabel="Szukaj po adresie, numerze lub właścicielu"
          listLabel="Lokale bez głosu"
          emptyMessage={
            apartments.failed
              ? 'Nie udało się pobrać lokali'
              : 'Brak lokali bez głosu'
          }
        />
      </div>
      {questions.map((question, index) => (
        <ChoicePicker
          key={question.id}
          name={`meeting-${question.id}`}
          legend={`${index + 1}. ${question.text}`}
          choices={choices}
          value={form.answers[question.id]}
          disabled={form.pending}
          onChange={(choice) => form.choose(question.id, choice)}
        />
      ))}
      <Button type="submit" disabled={form.pending || !form.complete}>
        <Plus />
        Zapisz głos
      </Button>
    </form>
  );
}
