const pad = (value: number) => String(value).padStart(2, '0');

/** YYYY-MM-DD in the local time zone (toISOString would use UTC). */
export function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
