/** Narrows rows the query already filtered with `email: { not: null }`. */
export function hasEmail<T extends { email: string | null }>(
  row: T
): row is T & { email: string } {
  return row.email !== null;
}
