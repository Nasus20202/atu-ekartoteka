'use client';

import { FileSearch, Loader2, XCircle } from 'lucide-react';

import { DownloadFindingsButton } from '@/components/settlement-import/download-findings-button';
import { SettlementImportOptionList } from '@/components/settlement-import/settlement-import-option-list';
import { SettlementImportResult } from '@/components/settlement-import/settlement-import-result';
import { SettlementPreview } from '@/components/settlement-import/settlement-preview';
import { useSettlementImport } from '@/components/settlement-import/use-settlement-import';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileInput } from '@/components/ui/file-input';
import { Label } from '@/components/ui/label';
import { ViewTransition } from '@/components/ui/view-transition';

const SPINNER = 'mr-2 h-4 w-4 motion-safe:animate-spin';

interface Props {
  onImported: () => Promise<void>;
}

export function SettlementImportCard({ onImported }: Props) {
  const state = useSettlementImport(onImported);
  const { files, preview, result, busy } = state;
  const shown = result ?? preview;

  return (
    <Card role="region" aria-label="Import rozliczeń" className="mt-6">
      <CardHeader>
        <CardTitle>Rozliczenia (PDF)</CardTitle>
        <CardDescription>
          Rozliczenia mediów i kosztów rzeczywistych. Najpierw zaimportuj
          naliczenia za te same okresy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settlementFiles">Pliki PDF</Label>
          <FileInput
            id="settlementFiles"
            files={files}
            accept=".pdf,application/pdf"
            multiple
            disabled={busy !== null}
            onChange={state.selectFiles}
          />
        </div>

        <SettlementImportOptionList
          options={state.options}
          disabled={busy !== null}
          onChange={(name, checked) => void state.setOption(name, checked)}
        />

        <Button
          className="w-full"
          variant="outline"
          disabled={files.length === 0 || busy !== null}
          onClick={() => void state.runPreview()}
        >
          {busy === 'preview' ? (
            <Loader2 className={SPINNER} aria-hidden="true" />
          ) : (
            <FileSearch className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {busy === 'preview' ? 'Sprawdzanie...' : 'Sprawdź pliki'}
        </Button>

        {state.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {shown && (
          <ViewTransition
            view={result ? 'result' : 'preview'}
            className="space-y-4"
          >
            <DownloadFindingsButton files={shown.files} />
            {result && <SettlementImportResult result={result} />}
            {preview && (
              <SettlementPreview
                preview={preview}
                options={state.options}
                accepted={state.accepted}
                busy={busy !== null}
                importing={busy === 'import'}
                onConfirmation={state.setConfirmation}
                onImport={() => void state.runImport()}
              />
            )}
          </ViewTransition>
        )}
      </CardContent>
    </Card>
  );
}
