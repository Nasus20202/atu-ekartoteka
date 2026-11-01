'use client';

import { ShieldOff, Trash2, Upload, XCircle } from 'lucide-react';

import { DatabaseStatsCard } from '@/app/admin/import/database-stats-card';
import { ImportResults } from '@/app/admin/import/import-results';
import { useDatabaseStats } from '@/app/admin/import/use-database-stats';
import { useImport } from '@/app/admin/import/use-import';
import { ValidateDatabaseCard } from '@/app/admin/import/validate-database-card';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
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

const directoryInputProps = {
  webkitdirectory: '',
  directory: '',
} as React.InputHTMLAttributes<HTMLInputElement>;

export default function AdminImportPage() {
  const { dbStats, statsLoading, fetchStats } = useDatabaseStats();
  const {
    files,
    loading,
    response,
    error,
    cleanImport,
    skipValidation,
    handleFileChange,
    handleImport,
    handleCleanImportChange,
    handleSkipValidationChange,
  } = useImport(fetchStats);

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
              onCheckedChange={(checked) => {
                void handleCleanImportChange(checked === true);
              }}
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
