'use client';

import { Combobox } from '@/components/ui/combobox';
import {
  type HoaOption,
  useHoaOptions,
} from '@/components/votings/use-hoa-options';

const NOT_FOUND = 'Nie znaleziono wspólnoty';
const SEARCH_FAILED = 'Nie udało się wyszukać wspólnot';

interface Props {
  hoas: HoaOption[];
  value: string;
  onValueChange: (hoaId: string) => void;
  /** Label of an extra first option with an empty value, e.g. every association */
  allLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** Choice of one association, found by typing its name or identifier. */
export function HoaCombobox({
  hoas,
  value,
  onValueChange,
  allLabel,
  ...props
}: Props) {
  const { search, setSearch, options, pending, failed } = useHoaOptions(hoas);
  const asOption = ({ id, name }: HoaOption) => ({ value: id, label: name });
  const all = allLabel ? [{ value: '', label: allLabel }] : [];
  const selected = hoas.find((hoa) => hoa.id === value);

  return (
    <Combobox
      {...props}
      value={value}
      selectedLabel={selected?.name ?? (value ? null : (allLabel ?? null))}
      options={
        failed ? [] : [...(search.trim() ? [] : all), ...options.map(asOption)]
      }
      search={search}
      busy={pending}
      onSearchChange={setSearch}
      onValueChange={onValueChange}
      placeholder="Wybierz wspólnotę"
      searchLabel="Szukaj wspólnoty"
      listLabel="Wspólnoty"
      emptyMessage={failed ? SEARCH_FAILED : NOT_FOUND}
    />
  );
}
