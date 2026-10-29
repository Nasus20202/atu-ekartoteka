import { APP_LOCALE } from '@/lib/utils/locale';

export function formatImportDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(APP_LOCALE);
}
