import { formatDate } from '@/lib/utils';

export function formatImportDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return formatDate(new Date(dateStr));
}
