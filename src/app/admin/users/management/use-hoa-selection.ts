import { useState } from 'react';

import { HoaGroup } from '@/app/admin/users/management/HoaCard';

export function useHoaSelection(hoas: HoaGroup[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allIds = hoas.flatMap((h) => h.apartments.map((a) => a.id));

  const isHoaSelected = (hoa: HoaGroup) =>
    hoa.apartments.every((a) => selectedIds.has(a.id));

  const isHoaIndeterminate = (hoa: HoaGroup) =>
    hoa.apartments.some((a) => selectedIds.has(a.id)) && !isHoaSelected(hoa);

  const toggleHoa = (hoa: HoaGroup) => {
    const next = new Set(selectedIds);
    if (isHoaSelected(hoa)) {
      hoa.apartments.forEach((a) => next.delete(a.id));
    } else {
      hoa.apartments.forEach((a) => next.add(a.id));
    }
    setSelectedIds(next);
  };

  const toggleApartment = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return {
    selectedIds,
    setSelectedIds,
    allIds,
    isHoaSelected,
    isHoaIndeterminate,
    toggleHoa,
    toggleApartment,
  };
}
