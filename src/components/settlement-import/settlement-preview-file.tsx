import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  DOCUMENT_LABELS,
  STATUS_LABELS,
  UNKNOWN_DOCUMENT_LABEL,
} from '@/components/settlement-import/labels';
import { SettlementFindings } from '@/components/settlement-import/settlement-findings';
import { SettlementRecordTable } from '@/components/settlement-import/settlement-record-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SettlementPreviewFileDto } from '@/lib/settlements/dto/settlement-import-dto';
import type { SettlementRecordStatus } from '@/lib/settlements/types/prepared-file';

interface Props {
  file: SettlementPreviewFileDto;
  /** The confirmations of the file's records */
  children: ReactNode;
}

const countByStatus = ({ records }: SettlementPreviewFileDto) =>
  (Object.keys(STATUS_LABELS) as SettlementRecordStatus[])
    .map((status) => ({
      status,
      count: records.filter((r) => r.status === status).length,
    }))
    .filter(({ count }) => count > 0)
    .map(({ status, count }) => `${STATUS_LABELS[status]}: ${count}`)
    .join(', ');

export function SettlementPreviewFile({ file, children }: Props) {
  return (
    <section
      aria-label={`Plik ${file.fileName}`}
      className="space-y-3 rounded-lg border p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="break-all text-sm font-semibold">{file.fileName}</h3>
        <Badge variant="secondary">
          {file.documentType
            ? DOCUMENT_LABELS[file.documentType]
            : UNKNOWN_DOCUMENT_LABEL}
        </Badge>
      </div>
      {file.errors.length > 0 && (
        <p className="text-sm font-medium text-destructive dark:text-red-300">
          Ten plik ma błędy i nie zostanie zaimportowany.
        </p>
      )}
      {children}
      <SettlementFindings errors={file.errors} warnings={file.warnings} />
      {file.records.length > 0 && (
        <Collapsible>
          <p className="text-sm text-muted-foreground">
            Rozliczeń: {file.records.length} ({countByStatus(file)})
          </p>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="group -ml-3"
              aria-label={`Pokaż rozliczenia z pliku ${file.fileName}`}
            >
              Pokaż rozliczenia
              <ChevronDown
                className="ml-1 h-4 w-4 motion-safe:transition-transform group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SettlementRecordTable records={file.records} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
