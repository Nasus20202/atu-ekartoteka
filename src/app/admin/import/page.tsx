'use client';

import { ShieldOff, Trash2, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';

import { DatabaseStatsCard } from '@/app/admin/import/database-stats-card';
import {
  CLEAN_IMPORT_CONFIRMATION,
  SKIP_VALIDATION_CONFIRMATION,
  SKIP_VALIDATION_FINAL_CONFIRMATION,
} from '@/app/admin/import/import-confirmations';
import { ImportResults } from '@/app/admin/import/import-results';
import { prepareImportFiles } from '@/app/admin/import/prepare-import-files';
import type { ImportResponse } from '@/app/admin/import/types';
import { useDatabaseStats } from '@/app/admin/import/use-database-stats';
import { ValidateDatabaseCard } from '@/app/admin/import/validate-database-card';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/utils/error-message';

export { ImportWarnings } from '@/app/admin/import/import-warnings';

const IMPORT_FAILED_MESSAGE = 'Import nie powiódł się';

const directoryInputProps = {
  webkitdirectory: '',
  directory: '',
} as React.InputHTMLAttributes<HTMLInputElement>;

export default function AdminImportPage() {
  const confirm = useConfirm();
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { dbStats, statsLoading, fetchStats } = useDatabaseStats();
  const [cleanImport, setCleanImport] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(event.target.files);
      setResponse(null);
      setError(null);
    }
  }

  async function handleImport() {
    if (!files) {
      return;
    }

    if (cleanImport) {
      const confirmed = await confirm(CLEAN_IMPORT_CONFIRMATION);

      if (!confirmed) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const fileData = await prepareImportFiles(files);

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileData, cleanImport, skipValidation }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || IMPORT_FAILED_MESSAGE);
      }

      setResponse(data);
      if (data.success) {
        await fetchStats();
      }
    } catch (err) {
      setError(getErrorMessage(err, IMPORT_FAILED_MESSAGE));
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipValidationChange(checked: boolean) {
    if (checked) {
      const first = await confirm(SKIP_VALIDATION_CONFIRMATION);

      if (!first) {
        return;
      }

      const second = await confirm(SKIP_VALIDATION_FINAL_CONFIRMATION);

      if (!second) {
        return;
      }
    }

    setSkipValidation(checked);
  }

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Import danych" showBackButton={false} />

      <DatabaseStatsCard dbStats={dbStats} statsLoading={statsLoading} />

      <ValidateDatabaseCard />

      <Card>
        <CardHeader>
          <CardTitle>Importuj dane</CardTitle>
          <CardDescription>
            Wybierz folder główny zawierający podfoldery wspólnot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Folder z danymi</Label>
            <Input
              id="files"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              disabled={loading}
              multiple
              suppressHydrationWarning
              {...directoryInputProps}
            />
            {files && (
              <p className="text-sm text-muted-foreground">
                Wybrano plików: {files.length}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="cleanImport"
              checked={cleanImport}
              onCheckedChange={(checked) => setCleanImport(checked === true)}
              disabled={loading}
            />
            <Label
              htmlFor="cleanImport"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              Czysty import (usuwa istniejące naliczenia, powiadomienia i
              wpłaty)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipValidation"
              checked={skipValidation}
              onCheckedChange={(checked) => {
                void handleSkipValidationChange(checked === true);
              }}
              disabled={loading}
            />
            <Label
              htmlFor="skipValidation"
              className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <ShieldOff className="h-4 w-4 text-orange-500" />
              Pomiń walidację
            </Label>
          </div>

          <Button
            onClick={() => {
              void handleImport();
            }}
            disabled={!files || loading}
            className="w-full"
            variant={cleanImport ? 'destructive' : 'default'}
          >
            {loading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importowanie...
              </>
            ) : cleanImport ? (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Importuj (z usunięciem danych)
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importuj
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Błąd importu</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ImportResults response={response} />
        </CardContent>
      </Card>
    </Page>
  );
}
