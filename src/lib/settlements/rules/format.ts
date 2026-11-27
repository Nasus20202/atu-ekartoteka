/** "2022-09-30" -> "30.09.2022" */
export const formatDay = (date: string) => date.split('-').reverse().join('.');

export const formatSpan = (from: string, to: string) =>
  `${formatDay(from)}–${formatDay(to)}`;
