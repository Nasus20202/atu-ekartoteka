import { AlertCircle } from 'lucide-react';

import type { ImportWarning } from '@/lib/import/types';

interface ImportWarningsProps {
  warnings: ImportWarning[];
}

export function ImportWarnings({ warnings }: ImportWarningsProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-orange-500/50 bg-orange-500/10 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
        <AlertCircle className="h-4 w-4" />
        Ostrzeżenia ({warnings.length})
      </div>
      <ul className="space-y-1 text-sm text-orange-700/90 dark:text-orange-200">
        {warnings.map((warning, idx) => (
          <li
            key={`${warning.apartmentExternalId}-${warning.period}-${warning.lineNo}-${idx}`}
          >
            • Lokal {warning.apartmentExternalId}, okres {warning.period}, linia{' '}
            {warning.lineNo}, różnica {warning.difference}: {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
