import { APP_LOCALE } from '@/lib/utils/locale';
const FEW_UPPER_BOUND = 5;

export function formatImportDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(APP_LOCALE);
}

export function getHoaCountLabel(count: number): string {
  if (count === 1) return 'wspólnotę';
  return count < FEW_UPPER_BOUND ? 'wspólnoty' : 'wspólnot';
}

export function getApartmentCountLabel(count: number): string {
  if (count === 1) return 'mieszkanie';
  return count < FEW_UPPER_BOUND ? 'mieszkania' : 'mieszkań';
}
