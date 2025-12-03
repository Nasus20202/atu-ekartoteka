/**
 * Date utilities for E2E tests
 */

export const POLISH_MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

const now = new Date();
export const CURRENT_MONTH_YEAR = `${POLISH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
