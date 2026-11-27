const pad = (value: number) => String(value).padStart(2, '0');

/** YYYY-MM-DD in the local time zone (toISOString would use UTC). */
export function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Value of the date and time picker: YYYY-MM-DDTHH:mm in local time. */
export function toLocalDateTimeInput(date: Date): string {
  return `${toLocalIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
