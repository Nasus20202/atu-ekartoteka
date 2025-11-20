'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(
      { error: error.message, stack: error.stack },
      'Charges page error'
    );
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-4 h-16 w-16 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold">Wystąpił błąd</h1>
            <p className="mb-6 text-center text-muted-foreground">
              Nie udało się wczytać naliczeń dla tego mieszkania.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => reset()}>Spróbuj ponownie</Button>
              <BackButton />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
