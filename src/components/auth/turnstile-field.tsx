'use client';

import { Turnstile } from '@marsidev/react-turnstile';

import { Skeleton } from '@/components/ui/skeleton';
import type { TurnstileState } from '@/hooks/use-turnstile';

/**
 * The widget's flexible size is 65px tall. The same slot wraps the loading
 * skeleton, so the card keeps its height while the config is being fetched.
 */
const WIDGET_SLOT_CLASS =
  'flex min-h-[65px] w-full items-center justify-center';
const WIDGET_HEIGHT_CLASS = 'h-[65px] w-[400px]';

export function TurnstileField({ turnstile }: { turnstile: TurnstileState }) {
  const { config, ref, setToken } = turnstile;

  if (!config) {
    return (
      <div className={WIDGET_SLOT_CLASS}>
        <Skeleton
          className={WIDGET_HEIGHT_CLASS}
          data-testid="turnstile-skeleton"
        />
      </div>
    );
  }

  if (!config.enabled || !config.siteKey) return null;

  return (
    <div className={WIDGET_SLOT_CLASS}>
      <Turnstile
        ref={ref}
        siteKey={config.siteKey}
        options={{ theme: 'auto', size: 'flexible', language: 'pl' }}
        onSuccess={(token: string) => setToken(token)}
        onExpire={() => setToken(null)}
        onError={() => setToken(null)}
      />
    </div>
  );
}
