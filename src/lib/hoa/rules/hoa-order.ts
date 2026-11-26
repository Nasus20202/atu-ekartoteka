export const HOA_ORDER_STORAGE_KEY = 'atu:hoa-order';

/** Reads a stored order, ignoring anything that is not a list of ids. */
export function parseHoaOrder(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

/**
 * Sorts items by their position in `order`. Items missing from `order`
 * (for example a HOA imported later) keep their relative order at the end,
 * and ids in `order` without an item are ignored.
 */
export function sortByHoaOrder<T extends { id: string }>(
  items: readonly T[],
  order: readonly string[]
): T[] {
  const position = new Map(order.map((id, index) => [id, index]));
  const known = items
    .filter((item) => position.has(item.id))
    .sort((a, b) => position.get(a.id)! - position.get(b.id)!);
  const unknown = items.filter((item) => !position.has(item.id));
  return [...known, ...unknown];
}

/** Returns a copy of `ids` with the element at `from` moved to `to`. */
export function moveHoaId(
  ids: readonly string[],
  from: number,
  to: number
): string[] {
  if (from === to || from < 0 || to < 0) return [...ids];
  if (from >= ids.length || to >= ids.length) return [...ids];
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
