'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  created: number;
  updated: number;
  deactivated: number;
  total: number;
  errors: string[];
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Import mieszkań</h1>

        <Card>
          <CardHeader>
            <CardTitle>Importuj plik lok.txt</CardTitle>
            <CardDescription>
              Wybierz plik lok.txt aby zaimportować lub zaktualizować dane
              mieszkań
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Plik lok.txt</Label>
              <Input
                id="file"
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                disabled={loading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Wybrany plik: {file.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || loading}
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

            {result && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Import zakończony pomyślnie</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.created}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Utworzonych
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {result.updated}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Zaktualizowanych
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {result.deactivated}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Dezaktywowanych
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{result.total}</div>
                      <p className="text-sm text-muted-foreground">
                        Razem w pliku
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                    <div className="mb-2 flex items-center gap-2 font-medium text-orange-800 dark:text-orange-200">
                      <AlertCircle className="h-5 w-5" />
                      Ostrzeżenia ({result.errors.length})
                    </div>
                    <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
