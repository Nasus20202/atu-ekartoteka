'use client';

import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect } from 'react';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import {
  formatDocumentTitle,
  PAGE_TITLES,
} from '@/lib/metadata/document-title';

const PAGE_TITLE = PAGE_TITLES.appError;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error({ error, digest: error.digest }, 'Application error');
  }, [error]);

  return (
    <>
      <title>{formatDocumentTitle(PAGE_TITLE)}</title>
      <StatusCard
        icon={AlertTriangle}
        iconClassName="text-destructive"
        title={PAGE_TITLE}
        actions={
          <>
            <Button onClick={() => reset()}>Spróbuj ponownie</Button>
            <Button
              variant="outline"
              onClick={() =>
                startTransition(() => {
                  router.push('/dashboard');
                  reset();
                })
              }
            >
              Powrót do strony głównej
            </Button>
          </>
        }
      >
        <p>Wystąpił nieoczekiwany błąd. Spróbuj ponownie.</p>
        {error.digest && (
          <p className="mt-3 text-xs">
            Kod błędu: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </StatusCard>
    </>
  );
}
