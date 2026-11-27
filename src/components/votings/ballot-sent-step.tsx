import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CONFIRMATION_RATE_LIMIT_MINUTES,
  CONFIRMATION_TTL_MINUTES,
} from '@/lib/voting/rules/voting-constants';

interface Props {
  pending: boolean;
  onResend: () => void;
  onBack: () => void;
}

export function BallotSentStep({ pending, onResend, onBack }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
        <MailCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden
        />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Sprawdź swoją skrzynkę email</p>
          <p>
            Otwórz wiadomość i kliknij link, aby potwierdzić swoją tożsamość i
            oddać głos. Link działa {CONFIRMATION_TTL_MINUTES} minut i tylko
            raz. Po potwierdzeniu głosu nie można zmienić.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Wiadomość nie dotarła? Sprawdź folder spam. Nowy link możesz wysłać co{' '}
        {CONFIRMATION_RATE_LIMIT_MINUTES} minut.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onResend}
        >
          Wyślij link ponownie
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
    </div>
  );
}
