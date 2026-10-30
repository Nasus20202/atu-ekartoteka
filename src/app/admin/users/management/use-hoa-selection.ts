import { useState } from 'react';

import { getActiveIds } from '@/app/admin/users/management/apartment-row';
import { HoaGroup } from '@/app/admin/users/management/hoa-card';

export function useHoaSelection(hoas: HoaGroup[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const safeHoas = hoas ?? [];
  const allIds = safeHoas.flatMap((h) => h.apartments.map((a) => a.id));

  const isHoaSelected = (hoa: HoaGroup) => {
    const activeIds = getActiveIds(hoa.apartments);
    return activeIds.length > 0 && activeIds.every((id) => selectedIds.has(id));
  };

  const isHoaIndeterminate = (hoa: HoaGroup) =>
    hoa.apartments.some((a) => selectedIds.has(a.id)) && !isHoaSelected(hoa);

  const toggleHoa = (hoa: HoaGroup) => {
    const next = new Set(selectedIds);
    if (isHoaSelected(hoa)) {
      hoa.apartments.forEach((a) => next.delete(a.id));
    } else {
      getActiveIds(hoa.apartments).forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleApartment = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectIds = (ids: string[], checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      ids.forEach((id) => next.add(id));
    } else {
      ids.forEach((id) => next.delete(id));
    }
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
    selectIds,
  };
}
