import { LayoutGrid, Table2 } from 'lucide-react';

import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui/segmented-control';
import { ListViewMode } from '@/lib/hooks/use-list-view-mode';

const OPTIONS = [
  { value: ListViewMode.CARDS, label: 'Kafelki', icon: LayoutGrid },
  { value: ListViewMode.TABLE, label: 'Tabela', icon: Table2 },
] as const satisfies readonly SegmentedControlOption<ListViewMode>[];

interface ListViewSwitchProps {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
}

export function ListViewSwitch({ value, onChange }: ListViewSwitchProps) {
  return (
    <SegmentedControl
      label="Widok listy"
      options={OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
