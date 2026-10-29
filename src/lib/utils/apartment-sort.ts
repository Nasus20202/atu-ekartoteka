interface SortableApartment {
  building?: string | null;
  number?: string | null;
}

const NATURAL_ORDER: Intl.CollatorOptions = {
  numeric: true,
  sensitivity: 'base',
};

/** Natural order by building, then number ("A/2" before "A/10"). */
export function compareApartmentsNaturally(
  a: SortableApartment,
  b: SortableApartment
): number {
  const buildingCmp = (a.building || '').localeCompare(
    b.building || '',
    undefined,
    NATURAL_ORDER
  );
  if (buildingCmp !== 0) return buildingCmp;
  return (a.number || '').localeCompare(
    b.number || '',
    undefined,
    NATURAL_ORDER
  );
}
