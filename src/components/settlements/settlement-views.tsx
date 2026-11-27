'use client';

import { AnnualView } from '@/components/settlements/annual-view';
import { EmptyView } from '@/components/settlements/empty-view';
import { MetersView } from '@/components/settlements/meters-view';
import { PeriodControl } from '@/components/settlements/period-control';
import {
  SETTLEMENT_PARAMS,
  SETTLEMENT_VIEWS,
  type SettlementViewKey,
} from '@/components/settlements/settlement-view-key';
import { UtilityView } from '@/components/settlements/utility-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewTransition } from '@/components/ui/view-transition';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';
import {
  formatAnnualPeriod,
  formatRange,
} from '@/lib/settlements/rules/view-format';

interface Props {
  data: ApartmentSettlementsDto;
  view: SettlementViewKey;
  onViewChange: (view: SettlementViewKey) => void;
}

/** The three settlement views, the same for the tenant and for admins. */
export function SettlementViews({ data, view, onViewChange }: Props) {
  const { utility, annual } = data;
  const period =
    view === 'annual'
      ? annual && {
          param: SETTLEMENT_PARAMS.annual,
          periods: data.annualPeriods,
          selectedId: annual.id,
          format: formatAnnualPeriod,
        }
      : utility && {
          param: SETTLEMENT_PARAMS.utility,
          periods: data.utilityPeriods,
          selectedId: utility.id,
          format: formatRange,
        };

  return (
    <Tabs
      value={view}
      onValueChange={(next) => onViewChange(next as SettlementViewKey)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TabsList
          aria-label="Widok rozliczeń"
          className="h-auto max-w-full flex-wrap"
        >
          {SETTLEMENT_VIEWS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="min-h-9 px-4">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {period && <PeriodControl {...period} />}
      </div>
      <TabsContent value="media">
        {utility ? (
          <ViewTransition view={utility.id}>
            <UtilityView settlement={utility} />
          </ViewTransition>
        ) : (
          <EmptyView message="Brak rozliczeń mediów dla tego lokalu." />
        )}
      </TabsContent>
      <TabsContent value="meters">
        {utility ? (
          <ViewTransition view={utility.id}>
            <MetersView
              settlement={utility}
              readings={data.readings}
              readingMeters={data.readingMeters}
              readingsQuery={data.readingsQuery}
              singlePeriod={data.utilityPeriods.length === 1}
            />
          </ViewTransition>
        ) : (
          <EmptyView message="Brak odczytów liczników dla tego lokalu." />
        )}
      </TabsContent>
      <TabsContent value="annual">
        {annual ? (
          <ViewTransition view={annual.id}>
            <AnnualView settlement={annual} />
          </ViewTransition>
        ) : (
          <EmptyView message="Brak rozliczeń kosztów rzeczywistych dla tego lokalu." />
        )}
      </TabsContent>
    </Tabs>
  );
}
