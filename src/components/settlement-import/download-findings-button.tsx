import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  type FileFindings,
  serialiseSettlementFindings,
} from '@/lib/settlements/rules/export-findings';
import { downloadTextFile } from '@/lib/shared/utils/download-file';

const FILE_NAME = 'uwagi-import-rozliczen.txt';

export function DownloadFindingsButton({ files }: { files: FileFindings[] }) {
  const text = serialiseSettlementFindings(files);
  if (!text) return null;

  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTextFile(text, FILE_NAME)}
      >
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        Pobierz błędy i ostrzeżenia
      </Button>
    </div>
  );
}
