interface SortableApartment {
  building?: string | null;
  number?: string | null;
}

// Built once: creating a collator per comparison dominates sorting large lists
const NATURAL_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

/** Natural order by building, then number ("A/2" before "A/10"). */
export function compareApartmentsNaturally(
  a: SortableApartment,
  b: SortableApartment
): number {
  return (
    NATURAL_COLLATOR.compare(a.building || '', b.building || '') ||
    NATURAL_COLLATOR.compare(a.number || '', b.number || '')
  );
}
