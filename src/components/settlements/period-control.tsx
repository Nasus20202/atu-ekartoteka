'use client';

import { useSettlementParams } from '@/components/settlements/use-settlement-params';
import { Select } from '@/components/ui/select';
import type { SettlementPeriodDto } from '@/lib/settlements/dto/settlement-view-dto';

interface Props {
  param: string;
  periods: SettlementPeriodDto[];
  selectedId: string;
  format: (from: string, to: string) => string;
}

export function PeriodControl({ param, periods, selectedId, format }: Props) {
  const { select } = useSettlementParams();
  const options = periods.map(({ id, periodFrom, periodTo }) => ({
    value: id,
    label: format(periodFrom, periodTo),
  }));

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span>Okres</span>
      {options.length === 1 ? (
        <span className="text-foreground">{options[0].label}</span>
      ) : (
        <Select
          aria-label="Okres"
          className="w-60 text-foreground"
          value={selectedId}
          options={options}
          onValueChange={(id) => select(param, id)}
        />
      )}
    </div>
  );
}
