export const collapseSpaces = (value: string) =>
  value.trim().replace(/\s+/g, ' ');

/** A name as it is compared: spacing and letter case carry no meaning. */
export const comparableText = (value: string) =>
  collapseSpaces(value).toLocaleLowerCase('pl');
