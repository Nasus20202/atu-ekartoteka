'use client';

import { Turnstile } from '@marsidev/react-turnstile';

import { TurnstileFitSlot } from '@/components/auth/turnstile-fit-slot';
import { useTurnstileFit } from '@/components/auth/use-turnstile-fit';
import { Skeleton } from '@/components/ui/skeleton';
import type { TurnstileState } from '@/hooks/use-turnstile';

export function TurnstileField({ turnstile }: { turnstile: TurnstileState }) {
  const { config, ref, setToken } = turnstile;
  const { slotRef, fit } = useTurnstileFit();

  if (!config) {
    return (
      <TurnstileFitSlot slotRef={slotRef} fit={fit}>
        <Skeleton className="h-full w-full" data-testid="turnstile-skeleton" />
      </TurnstileFitSlot>
    );
  }

  if (!config.enabled || !config.siteKey) return null;

  return (
    <TurnstileFitSlot slotRef={slotRef} fit={fit}>
      <Turnstile
        ref={ref}
        siteKey={config.siteKey}
        options={{ theme: 'auto', size: 'flexible', language: 'pl' }}
        onSuccess={(token: string) => setToken(token)}
        onExpire={() => setToken(null)}
        onError={() => setToken(null)}
      />
    </TurnstileFitSlot>
  );
}
