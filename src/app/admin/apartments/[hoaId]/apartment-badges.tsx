import { AlertTriangle } from 'lucide-react';

export function ApartmentStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
      Aktywne
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
      Nieaktywne
    </span>
  );
}

export function DuplicateAddressBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
      <AlertTriangle className="h-3 w-3" />
      Duplikat adresu
    </span>
  );
}
