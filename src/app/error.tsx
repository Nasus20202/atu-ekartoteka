'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

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
    // Log the error to an error reporting service
    logger.error(
      { error: error.message, stack: error.stack },
      'Application error'
    );
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-4 h-16 w-16 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold">Coś poszło nie tak!</h1>
            <p className="mb-6 text-center text-muted-foreground">
              Wystąpił nieoczekiwany błąd. Spróbuj ponownie.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => reset()}>Spróbuj ponownie</Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/dashboard')}
              >
                Powrót do strony głównej
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
