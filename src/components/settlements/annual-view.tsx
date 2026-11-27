import { AnnualItemsTable } from '@/components/settlements/annual-items-table';
import { DocumentDetails } from '@/components/settlements/document-details';
import { ResultBanner } from '@/components/settlements/result-banner';
import { Card, CardContent } from '@/components/ui/card';
import type { AnnualSettlementDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatRange } from '@/lib/settlements/rules/view-format';
import {
  annualResultTitle,
  COMMUNITY_AMOUNT_NOTE,
} from '@/lib/settlements/rules/view-wording';
import { formatCountPl, ITEM_FORMS } from '@/lib/shared/utils/pluralize';

interface Props {
  settlement: AnnualSettlementDto;
}

export function AnnualView({ settlement }: Props) {
  const { items, totalAmount, periodFrom, periodTo } = settlement;

  return (
    <div className="space-y-4">
      <ResultBanner
        label="Suma rozliczenia rocznego"
        title={annualResultTitle(totalAmount, periodTo)}
        amount={totalAmount}
      >
        <div className="text-muted-foreground">
          {formatCountPl(items.length, ITEM_FORMS)} ·{' '}
          {formatRange(periodFrom, periodTo)}
        </div>
      </ResultBanner>
      <Card>
        <CardContent className="px-6 py-2">
          <AnnualItemsTable items={items} totalAmount={totalAmount} />
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">{COMMUNITY_AMOUNT_NOTE}</p>
      <DocumentDetails {...settlement} />
    </div>
  );
}
