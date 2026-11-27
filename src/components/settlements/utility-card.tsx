'use client';

import { ChevronDown } from 'lucide-react';

import { MeterLine } from '@/components/settlements/meter-line';
import { ResultAmount } from '@/components/settlements/result-amount';
import { SettlementLinesTable } from '@/components/settlements/settlement-lines-table';
import { UsageBar } from '@/components/settlements/usage-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { UtilityDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatVolume } from '@/lib/settlements/rules/view-format';
import {
  describeUsage,
  utilityHeading,
} from '@/lib/settlements/rules/view-wording';

interface Props {
  utility: UtilityDto;
}

export function UtilityCard({ utility }: Props) {
  const { name, code, unit, meters, consumption, advanceQuantity } = utility;
  const usage = describeUsage(consumption, advanceQuantity);
  const heading = utilityHeading(name, code);

  return (
    <Card role="region" aria-label={heading}>
      <Collapsible>
        <div className="flex flex-wrap items-center gap-6 p-6">
          <div className="min-w-0 flex-[1_1_16rem]">
            <h2 className="font-semibold">{heading}</h2>
            {meters.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Brak odczytu licznika
              </div>
            ) : (
              meters.map((meter) => <MeterLine key={meter.id} meter={meter} />)
            )}
          </div>
          <div className="flex-[1_1_18rem]">
            <div className="flex flex-wrap justify-between gap-x-3">
              <span>
                Zużycie <strong>{formatVolume(consumption, unit)}</strong>
              </span>
              <span className="text-muted-foreground">
                zaliczka {formatVolume(advanceQuantity, unit)}
              </span>
            </div>
            {usage && <UsageBar usage={usage} />}
          </div>
          <div className="flex w-full items-center justify-between gap-6 sm:w-auto">
            <ResultAmount
              amount={utility.amount}
              className="min-w-32 sm:text-right"
            />
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="data-[state=open]:[&_svg]:rotate-180"
              >
                Szczegóły
                <ChevronDown className="ml-2 h-4 w-4 transition-transform" />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t px-6 py-2">
            <SettlementLinesTable
              label={`Szczegóły: ${heading}`}
              lines={utility.lines}
              unit={unit}
              total={utility}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
