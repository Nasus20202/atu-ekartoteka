import { Loader2, Trash2, Upload } from 'lucide-react';

import { findImportBlockers } from '@/components/settlement-import/import-blockers';
import { SettlementBlockers } from '@/components/settlement-import/settlement-blockers';
import { SettlementConfirmations } from '@/components/settlement-import/settlement-confirmations';
import { SettlementPreviewFile } from '@/components/settlement-import/settlement-preview-file';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type {
  SettlementConfirmation,
  SettlementPreviewResponse,
} from '@/lib/settlements/dto/settlement-import-dto';
import type { SettlementImportOptions } from '@/lib/settlements/types/prepared-file';

const ICON = 'mr-2 h-4 w-4';

interface Props {
  preview: SettlementPreviewResponse;
  options: SettlementImportOptions;
  accepted: SettlementConfirmation[];
  busy: boolean;
  importing: boolean;
  onConfirmation: (
    confirmation: SettlementConfirmation,
    checked: boolean
  ) => void;
  onImport: () => void;
}

/** What an import of the files would do, with the button that runs it. */
export function SettlementPreview({
  preview,
  options: { cleanImport, skipValidation },
  accepted,
  busy,
  importing,
  onConfirmation,
  onImport,
}: Props) {
  const blockers = findImportBlockers(preview.files, accepted);
  // A clean import writes every file or none
  const importable = cleanImport
    ? blockers.length === 0
    : preview.files.some((file) => file.errors.length === 0);
  const Icon = importing ? Loader2 : cleanImport ? Trash2 : Upload;

  return (
    <div role="region" aria-label="Podgląd rozliczeń" className="space-y-4">
      {skipValidation && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertDescription>
            Walidacja pominięta: ostrzeżenia nie blokują importu.
          </AlertDescription>
        </Alert>
      )}
      {cleanImport && (
        <Alert variant="destructive">
          <AlertDescription>
            Czysty import usunie zapisane rozliczenia: {preview.removals}.
          </AlertDescription>
        </Alert>
      )}
      {preview.files.map((file, index) => (
        <SettlementPreviewFile key={index} file={file}>
          {file.errors.length === 0 && (
            <SettlementConfirmations
              records={file.records}
              accepted={accepted}
              disabled={busy}
              onChange={onConfirmation}
            />
          )}
        </SettlementPreviewFile>
      ))}
      <SettlementBlockers blockers={blockers} cleanImport={cleanImport} />
      <Button
        // The clean import label takes two lines on a phone
        className="h-auto min-h-9 w-full whitespace-normal"
        variant={cleanImport ? 'destructive' : 'default'}
        disabled={!importable || busy}
        onClick={onImport}
      >
        <Icon
          className={importing ? `${ICON} motion-safe:animate-spin` : ICON}
          aria-hidden="true"
        />
        {importing
          ? 'Importowanie...'
          : cleanImport
            ? 'Importuj rozliczenia (z usunięciem danych)'
            : 'Importuj rozliczenia'}
      </Button>
    </div>
  );
}
