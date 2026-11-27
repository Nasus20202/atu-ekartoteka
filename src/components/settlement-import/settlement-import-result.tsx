import { SettlementFindings } from '@/components/settlement-import/settlement-findings';
import { SuccessMessage } from '@/components/ui/success-message';
import type { SettlementImportResponse } from '@/lib/settlements/dto/settlement-import-dto';

export function SettlementImportResult({
  result,
}: {
  result: SettlementImportResponse;
}) {
  return (
    <div
      role="region"
      aria-label="Wynik importu rozliczeń"
      className="space-y-4"
    >
      {result.success && (
        <SuccessMessage>Import rozliczeń zakończony pomyślnie</SuccessMessage>
      )}
      {result.removed > 0 && (
        <p className="text-sm text-muted-foreground">
          Usunięto zapisanych rozliczeń: {result.removed}
        </p>
      )}
      {result.files.map((file, index) => (
        <section
          key={index}
          aria-label={`Plik ${file.fileName}`}
          className="space-y-3 rounded-lg border p-4"
        >
          <h3 className="break-all text-sm font-semibold">{file.fileName}</h3>
          <p
            className={
              file.imported
                ? 'text-sm text-muted-foreground'
                : 'text-sm font-medium text-destructive dark:text-red-300'
            }
          >
            {file.imported
              ? `Utworzono: ${file.stats.created}, zaktualizowano: ${file.stats.updated}, bez zmian: ${file.stats.unchanged}`
              : 'Pliku nie zaimportowano. Nic z niego nie zostało zapisane.'}
          </p>
          <SettlementFindings errors={file.errors} warnings={file.warnings} />
        </section>
      ))}
    </div>
  );
}
