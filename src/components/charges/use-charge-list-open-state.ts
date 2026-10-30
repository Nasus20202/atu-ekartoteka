import { useState } from 'react';

import { getPeriodYear } from '@/lib/utils/group-by-year';

function useToggleSet(initial: () => Set<string>) {
  const [values, setValues] = useState(initial);

  function toggle(value: string) {
    setValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return [values, toggle] as const;
}

// Only the newest year is open by default; an active month also opens itself and its year
export function useChargeListOpenState(
  newestYear: string | undefined,
  activeMonth: string | null
) {
  const [openYears, toggleYear] = useToggleSet(() => {
    const initial = new Set<string>();
    if (newestYear) initial.add(newestYear);
    if (activeMonth) initial.add(getPeriodYear(activeMonth));
    return initial;
  });

  const [openMonths, toggleMonth] = useToggleSet(
    () => new Set(activeMonth ? [activeMonth] : [])
  );

  return { openYears, toggleYear, openMonths, toggleMonth };
}
