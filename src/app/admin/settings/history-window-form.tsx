'use client';

import { type FormEvent, useState } from 'react';

import type { SaveStatus } from '@/app/admin/settings/use-app-settings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NumberStepper } from '@/components/ui/number-stepper';
import { SuccessMessage } from '@/components/ui/success-message';
import {
  MAX_TENANT_HISTORY_YEARS_BACK,
  MIN_TENANT_HISTORY_YEARS_BACK,
  parseYearsBack,
} from '@/lib/settings/constants';
import { getHistoryStartYear } from '@/lib/utils/history-window';

const INPUT_ID = 'tenant-history-years-back';
const INVALID_MESSAGE = `Podaj liczbę całkowitą od ${MIN_TENANT_HISTORY_YEARS_BACK} do ${MAX_TENANT_HISTORY_YEARS_BACK}`;

interface HistoryWindowFormProps {
  savedYearsBack: number;
  saving: boolean;
  status: SaveStatus;
  onEdit: () => void;
  onInvalid: (message: string) => void;
  onSave: (yearsBack: number) => void;
}

function describeVisibleYears(yearsBack: number): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = getHistoryStartYear(now, yearsBack);

  return startYear === currentYear
    ? `Mieszkańcy widzą tylko rok ${currentYear}`
    : `Mieszkańcy widzą lata ${startYear}–${currentYear}`;
}

export function HistoryWindowForm({
  savedYearsBack,
  saving,
  status,
  onEdit,
  onInvalid,
  onSave,
}: HistoryWindowFormProps) {
  const [value, setValue] = useState(String(savedYearsBack));
  const parsed = value.trim() === '' ? null : parseYearsBack(Number(value));
  const isUnchanged = parsed === savedYearsBack;

  function handleValueChange(next: string) {
    setValue(next);
    onEdit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (parsed === null) {
      onInvalid(INVALID_MESSAGE);
      return;
    }

    onSave(parsed);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={INPUT_ID}>
          Liczba poprzednich lat widocznych dla mieszkańców
        </Label>
        <NumberStepper
          id={INPUT_ID}
          value={value}
          min={MIN_TENANT_HISTORY_YEARS_BACK}
          max={MAX_TENANT_HISTORY_YEARS_BACK}
          onValueChange={handleValueChange}
          decrementLabel="Mniej lat"
          incrementLabel="Więcej lat"
        />
        {parsed !== null && (
          <p className="text-sm text-muted-foreground">
            {describeVisibleYears(parsed)}
          </p>
        )}
      </div>

      {status.kind === 'saved' && (
        <SuccessMessage>Zapisano ustawienia</SuccessMessage>
      )}
      {status.kind === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={saving || isUnchanged}>
        {saving ? 'Zapisywanie...' : 'Zapisz'}
      </Button>
    </form>
  );
}
