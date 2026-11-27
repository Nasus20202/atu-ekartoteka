import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CONFIRMATION_CODE_LENGTH,
  CONFIRMATION_RATE_LIMIT_MINUTES,
} from '@/lib/voting/rules/voting-constants';

interface Props {
  code: string;
  pending: boolean;
  onCodeChange: (code: string) => void;
  onConfirm: () => void;
  onResend: () => void;
  onBack: () => void;
}

export function BallotCodeStep({
  code,
  pending,
  onCodeChange,
  onConfirm,
  onResend,
  onBack,
}: Props) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
        <MailCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden
        />
        <p className="text-sm">
          Wysłaliśmy {CONFIRMATION_CODE_LENGTH}-cyfrowy kod na Twój adres email.
          Wpisz go, aby potwierdzić swoją tożsamość i oddać głos. Po
          potwierdzeniu głosu nie można zmienić.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vote-code">Kod z wiadomości</Label>
        <Input
          id="vote-code"
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CONFIRMATION_CODE_LENGTH}
          disabled={pending}
          placeholder="000000"
          className="h-12 max-w-48 text-center font-mono text-xl tracking-[0.4em]"
          onChange={(event) =>
            onCodeChange(event.target.value.replace(/\D/g, ''))
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Kod nie dotarł? Sprawdź folder spam. Nowy kod możesz wysłać co{' '}
        {CONFIRMATION_RATE_LIMIT_MINUTES} minut.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending || code.length !== CONFIRMATION_CODE_LENGTH}
        >
          Potwierdź i zagłosuj
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onResend}
        >
          Wyślij kod ponownie
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onBack}
        >
          Zmień odpowiedzi
        </Button>
      </div>
    </form>
  );
}
