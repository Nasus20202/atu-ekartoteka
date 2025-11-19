'use client';

import { AlertCircle, CheckCircle, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';

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

interface ImportResult {
  hoaId: string;
  created: number;
  updated: number;
  deactivated: number;
  total: number;
  errors: string[];
  charges?: {
    created: number;
    updated: number;
    skipped: number;
    total: number;
  };
  notifications?: {
    imported: number;
    skipped: number;
  };
  payments?: {
    imported: number;
    skipped: number;
  };
}

interface ImportResponse {
  success: boolean;
  results: ImportResult[];
  errors: Array<{ file: string; error: string }>;
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
      const formData = new FormData();

      // Support both webkitRelativePath (directory upload) and regular files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Use webkitRelativePath if available, otherwise use file.name
        const filePath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name;

        // Create a new File with the path in the name
        const fileWithPath = new File([file], filePath, { type: file.type });
        formData.append('files', fileWithPath);
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
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
    <div className="min-h-screen bg-background p-8 animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold animate-slide-in-top">
          Import danych
        </h1>

        <Card className="animate-scale-in">
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
                          • {err.file}: {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {response.results.map((result, index) => (
                  <Card
                    key={result.hoaId}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
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
                              {result.created}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Utworzonych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {result.updated}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Zaktualizowanych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {result.deactivated}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Dezaktywowanych
                            </p>
                          </div>

                          <div className="rounded-lg border p-4">
                            <div className="text-2xl font-bold">
                              {result.total}
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
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border p-4">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {result.notifications.imported}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Zaimportowanych
                              </p>
                            </div>

                            <div className="rounded-lg border p-4">
                              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {result.notifications.skipped}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Pominiętych
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
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border p-4">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {result.payments.imported}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Zaimportowanych
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
      </div>
    </div>
  );
}
