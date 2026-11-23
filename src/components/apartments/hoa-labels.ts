import { formatUtcDate } from '@/lib/shared/utils';

export function formatImportDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return formatUtcDate(new Date(dateStr));
}
