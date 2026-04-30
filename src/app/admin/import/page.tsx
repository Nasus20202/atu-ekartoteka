'use client';

import { ShieldOff, Trash2, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DatabaseStatsCard } from '@/app/admin/import/database-stats-card';
import { ImportResults } from '@/app/admin/import/import-results';
import type { DatabaseStats, ImportResponse } from '@/app/admin/import/types';
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

export { ImportWarnings } from '@/app/admin/import/import-warnings';

export default function AdminImportPage() {
  const confirm = useConfirm();
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [cleanImport, setCleanImport] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);

  async function fetchStats() {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/stats');

      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch {
      // Ignore stats errors
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    void fetchStats();
  }, []);

  useEffect(() => {
    if (response?.success) {
      void fetchStats();
    }
  }, [response]);

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
      const confirmed = await confirm({
        title: 'Potwierdzenie czystego importu',
        description:
          'Czy na pewno chcesz wykonać czysty import? Ta operacja usunie wszystkie istniejące naliczenia, powiadomienia o opłatach i wpłaty. Mieszkania i użytkownicy nie zostaną usunięci.',
        confirmText: 'Tak, usuń i importuj',
        cancelText: 'Anuluj',
        variant: 'destructive',
      });

      if (!confirmed) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const fileData: Array<{ path: string; content: string; name: string }> =
        [];

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const filePath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name;

        const arrayBuffer = await file.arrayBuffer();
        const stream = new Blob([arrayBuffer]).stream();
        const compressedStream = stream.pipeThrough(
          new CompressionStream('gzip')
        );
        const compressedBlob = await new Response(compressedStream).blob();
        const compressedBuffer = await compressedBlob.arrayBuffer();

        const base64 = btoa(
          new Uint8Array(compressedBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        fileData.push({
          path: filePath,
          name: file.name,
          content: base64,
        });
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileData, cleanImport, skipValidation }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipValidationChange(checked: boolean) {
    if (checked) {
      const first = await confirm({
        title: 'Pominięcie walidacji',
        description:
          'Czy na pewno chcesz pominąć walidację danych? Import może zawierać błędne lub niespójne dane.',
        confirmText: 'Tak, pomiń walidację',
        cancelText: 'Anuluj',
        variant: 'destructive',
      });

      if (!first) {
        return;
      }

      const second = await confirm({
        title: 'Potwierdzenie – pominięcie walidacji',
        description:
          'To jest ostateczne potwierdzenie. Importowane dane nie zostaną sprawdzone pod kątem poprawności sum i sald. Czy kontynuować?',
        confirmText: 'Potwierdzam – pomiń walidację',
        cancelText: 'Anuluj',
        variant: 'destructive',
      });

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
              // @ts-expect-error - webkitdirectory is not in the type definitions
              webkitdirectory=""
              directory=""
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
