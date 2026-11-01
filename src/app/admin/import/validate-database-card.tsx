'use client';

import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import type { ImportResponse } from '@/app/admin/import/types';
import { ValidationResults } from '@/app/admin/import/validation-results';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils/error-message';

const VALIDATION_FAILED_MESSAGE = 'Walidacja danych nie powiodła się';

export function ValidateDatabaseCard() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate() {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/admin/import/validate', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || VALIDATION_FAILED_MESSAGE);
      }

      setResponse(data);
    } catch (err) {
      setError(getErrorMessage(err, VALIDATION_FAILED_MESSAGE));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Waliduj dane w bazie</CardTitle>
        <CardDescription>
          Uruchamia te same kontrole co przy imporcie na danych zapisanych w
          bazie. Żadne dane nie są zmieniane.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => {
            void handleValidate();
          }}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <ShieldCheck
            className={`mr-2 h-4 w-4 ${loading ? 'animate-pulse' : ''}`}
          />
          {loading ? 'Walidowanie...' : 'Waliduj dane'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Błąd walidacji</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && <ValidationResults response={response} />}
      </CardContent>
    </Card>
  );
}
