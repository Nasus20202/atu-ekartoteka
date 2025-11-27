'use client';

import { AlertCircle, CheckCircle, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EntityStats {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  total: number;
}

interface ImportResult {
  hoaId: string;
  apartments: EntityStats;
  errors: string[];
  charges?: EntityStats;
  notifications?: EntityStats;
  payments?: EntityStats;
}

interface ImportResponse {
  success: boolean;
  results: ImportResult[];
  errors: Array<{ hoaId?: string; file?: string; error: string }>;
}

export default function AdminImportPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setResponse(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!files) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Convert files to base64 and send as JSON to avoid HTTP/2 flow control issues
      const fileData: Array<{ path: string; content: string; name: string }> =
        [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name;

        // Compress file content with gzip, then base64 encode
        const arrayBuffer = await file.arrayBuffer();
        const stream = new Blob([arrayBuffer]).stream();
        const compressedStream = stream.pipeThrough(
          new CompressionStream('gzip')
        );
        const compressedBlob = await new Response(compressedStream).blob();
        const compressedBuffer = await compressedBlob.arrayBuffer();

        // Convert compressed data to base64
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

      // Send as JSON
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileData }),
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
  };

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Import danych" showBackButton={false} />

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

          <Button
            onClick={handleImport}
            disabled={!files || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importowanie...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importuj
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Błąd importu</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              {response.success && (
                <div className="flex items-start gap-2 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Import zakończony pomyślnie</p>
                  </div>
                </div>
              )}

              {response.errors.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                  <div className="mb-2 flex items-center gap-2 font-medium text-orange-800 dark:text-orange-200">
                    <AlertCircle className="h-5 w-5" />
                    Błędy plików ({response.errors.length})
                  </div>
                  <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                    {response.errors.map((err, idx) => (
                      <li key={idx}>
                        • {err.file || err.hoaId}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {response.results.map((result) => (
                <Card key={result.hoaId}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Wspólnota: {result.hoaId}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Mieszkania
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border p-4">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {result.apartments.created}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Utworzonych
                          </p>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {result.apartments.updated}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Zaktualizowanych
                          </p>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {result.apartments.deleted}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Dezaktywowanych
                          </p>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="text-2xl font-bold">
                            {result.apartments.total}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Razem w pliku
                          </p>
                        </div>
                      </div>
                    </div>

                    {result.charges && (
                      <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                          Naliczenia
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {result.charges.created}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Utworzonych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {result.charges.updated}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Zaktualizowanych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                              {result.charges.skipped}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Pominiętych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold">
                              {result.charges.total}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Razem w pliku
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.notifications && (
                      <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                          Powiadomienia o opłatach
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {result.notifications.created}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Utworzonych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {result.notifications.updated}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Zaktualizowanych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {result.notifications.deleted}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Usuniętych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold">
                              {result.notifications.total}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Razem w pliku
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.payments && (
                      <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                          Wpłaty
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {result.payments.created}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Utworzonych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {result.payments.updated}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Zaktualizowanych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                              {result.payments.skipped}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Pominiętych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold">
                              {result.payments.total}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Razem w pliku
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.errors.length > 0 && (
                      <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-200">
                          <AlertCircle className="h-4 w-4" />
                          Ostrzeżenia ({result.errors.length})
                        </div>
                        <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                          {result.errors.map((err, idx) => (
                            <li key={idx}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
