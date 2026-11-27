'use client';

import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AbstainToggle } from '@/components/votings/abstain-toggle';
import { HoaCombobox } from '@/components/votings/hoa-combobox';
import {
  useVotingForm,
  type VotingFormValues,
} from '@/components/votings/use-voting-form';
import { VotingQuestionFields } from '@/components/votings/voting-question-fields';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  VOTING_PATHS,
} from '@/lib/voting/rules/voting-constants';

interface Props {
  initial: VotingFormValues;
  hoas: { id: string; name: string }[];
}

export function VotingForm({ initial, hoas }: Props) {
  const form = useVotingForm(initial);
  const { fields } = form;
  const isEdit = Boolean(initial.votingId);
  const fixed = form.saving || initial.locked === true;
  const cancelHref = isEdit
    ? `${VOTING_PATHS.admin}/${initial.votingId}`
    : VOTING_PATHS.admin;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Dane głosowania</CardTitle>
          <CardDescription>
            Głosowanie dotyczy jednej wspólnoty. Wersję roboczą widzi tylko
            administrator, a po opublikowaniu nie można jej już edytować.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="voting-hoa">Wspólnota</Label>
            <HoaCombobox
              id="voting-hoa"
              hoas={hoas}
              value={fields.hoaId}
              disabled={fixed}
              onValueChange={form.setHoaId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voting-title">Tytuł</Label>
            <Input
              id="voting-title"
              value={fields.title}
              maxLength={MAX_TITLE_LENGTH}
              disabled={form.saving}
              placeholder="np. Uchwała w sprawie remontu dachu"
              onChange={(event) => form.setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voting-description">Opis (opcjonalnie)</Label>
            <Textarea
              id="voting-description"
              value={fields.description}
              maxLength={MAX_DESCRIPTION_LENGTH}
              disabled={form.saving}
              onChange={(event) => form.setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voting-ends-at">
              Termin zakończenia (opcjonalnie)
            </Label>
            <DateTimePicker
              id="voting-ends-at"
              value={fields.endsAt}
              placeholder="Bez terminu"
              disabled={form.saving}
              onChange={form.setEndsAt}
            />
            <p className="text-xs text-muted-foreground">
              Po tym terminie nie można już oddać głosu. Bez terminu głosowanie
              trwa do ręcznego zakończenia.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          {initial.locked && (
            <Alert>
              <AlertDescription>
                W tym głosowaniu są głosy z zebrania, więc wspólnoty, pytań i
                blokady wstrzymania się nie można zmienić. Aby je edytować, usuń
                wpisane głosy.
              </AlertDescription>
            </Alert>
          )}
          <VotingQuestionFields
            questions={fields.questions}
            canAdd={form.canAddQuestion}
            canRemove={form.canRemoveQuestion}
            disabled={fixed}
            onAdd={form.addQuestion}
            onChange={form.changeQuestion}
            onRemove={form.removeQuestion}
            onMove={form.moveQuestion}
          />
          <AbstainToggle
            blocked={!fields.allowAbstain}
            disabled={fixed}
            onChange={(blocked) => form.setAllowAbstain(!blocked)}
          />
        </CardContent>
      </Card>

      <AnimatedAlert show={form.error !== null} variant="destructive">
        {form.error}
      </AnimatedAlert>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.saving}>
          {isEdit ? 'Zapisz zmiany' : 'Utwórz głosowanie'}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Anuluj</Link>
        </Button>
      </div>
    </form>
  );
}
