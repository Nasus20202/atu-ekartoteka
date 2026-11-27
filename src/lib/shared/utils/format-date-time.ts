import { APP_LOCALE } from '@/lib/shared/utils/locale';

const APP_TIME_ZONE = 'Europe/Warsaw';

const formatter = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: APP_TIME_ZONE,
});

/** "27 listopada 2026 12:30" in the app's time zone, the same on server and client. */
export function formatDateTime(value: Date | string): string {
  return formatter.format(new Date(value));
}
