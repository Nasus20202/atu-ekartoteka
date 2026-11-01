import { AlertCircle } from 'lucide-react';

import { GroupedIssues } from '@/app/admin/import/grouped-issues';
import { groupWarnings } from '@/app/admin/import/warning-groups';
import type { ImportWarning } from '@/lib/import/types';

interface ImportWarningsProps {
  warnings: ImportWarning[];
}

function formatWarningLocation(warning: ImportWarning): string {
  return [
    `Lokal ${warning.apartmentExternalId}`,
    warning.period !== undefined && `okres ${warning.period}`,
    warning.lineNo !== undefined && `linia ${warning.lineNo}`,
    warning.difference !== undefined && `różnica ${warning.difference}`,
  ]
    .filter(Boolean)
    .join(', ');
}

export function ImportWarnings({ warnings }: ImportWarningsProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-orange-500/50 bg-orange-500/10 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
        <AlertCircle className="h-4 w-4" />
        Ostrzeżenia ({warnings.length})
      </div>
      <GroupedIssues
        groups={groupWarnings(warnings)}
        tone="warning"
        formatItem={(warning) =>
          `${formatWarningLocation(warning)}: ${warning.message}`
        }
      />
    </div>
  );
}
