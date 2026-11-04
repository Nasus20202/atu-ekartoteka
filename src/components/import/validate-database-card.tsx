'use client';

import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import useSWRMutation from 'swr/mutation';

import type { ImportResponse } from '@/components/import/types';
import { ValidationResults } from '@/components/import/validation-results';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { jsonPoster } from '@/lib/swr/json-mutation';
import { getErrorMessage } from '@/lib/utils/error-message';

const VALIDATE_URL = '/api/admin/import/validate';
const VALIDATION_FAILED_MESSAGE = 'Walidacja danych nie powiodła się';

interface ValidateBody {
  skipFullValidation: boolean;
}

const validateDatabase = jsonPoster<ValidateBody, ImportResponse>(
  VALIDATION_FAILED_MESSAGE
);

export function ValidateDatabaseCard() {
  const [loading, setLoading] = useState(false);
  const [skipFullValidation, setSkipFullValidation] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { trigger: validate } = useSWRMutation(VALIDATE_URL, validateDatabase);

  async function handleValidate() {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await validate({ skipFullValidation });

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
          Sprawdza salda lat i dane zapisane w bazie. Żadne dane nie są
          zmieniane.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="skipFullValidation"
            checked={skipFullValidation}
            onCheckedChange={(checked) =>
              setSkipFullValidation(checked === true)
            }
            disabled={loading}
          />
          <Label
            htmlFor="skipFullValidation"
            className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Pomiń pełną walidację
          </Label>
        </div>

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
