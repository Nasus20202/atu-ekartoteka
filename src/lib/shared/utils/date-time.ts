// A local date and time as "YYYY-MM-DDTHH:mm", the value of the date picker

export const MAX_HOURS = 23;
export const MAX_MINUTES = 59;

const PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

export interface DateTimeParts {
  /** "YYYY-MM-DD" */
  day: string;
  hours: number;
  minutes: number;
  /** "HH:mm" */
  time: string;
}

export function splitDateTime(value: string): DateTimeParts | null {
  const match = PATTERN.exec(value);
  if (!match) return null;

  const [, day, hours, minutes] = match;
  return {
    day,
    hours: Number(hours),
    minutes: Number(minutes),
    time: `${hours}:${minutes}`,
  };
}

export function joinDateTime(
  day: string,
  // A deadline chosen by its day alone lasts until the end of that day
  hours = MAX_HOURS,
  minutes = MAX_MINUTES
): string {
  return `${day}T${pad(hours)}:${pad(minutes)}`;
}
