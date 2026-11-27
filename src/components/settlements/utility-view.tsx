import { DocumentDetails } from '@/components/settlements/document-details';
import { OtherEntriesCard } from '@/components/settlements/other-entries-card';
import { ResultBanner } from '@/components/settlements/result-banner';
import { UtilityCard } from '@/components/settlements/utility-card';
import type { UtilitySettlementDto } from '@/lib/settlements/dto/settlement-view-dto';
import { utilityResultTitle } from '@/lib/settlements/rules/view-wording';
import { formatCurrency } from '@/lib/shared/utils';

interface Props {
  settlement: UtilitySettlementDto;
}

export function UtilityView({ settlement }: Props) {
  const { utilities, otherLines, otherMeters, totalAmount } = settlement;
  const sums = [
    ['Suma zaliczek', settlement.advanceAmount],
    ['Koszt zużycia', settlement.consumptionAmount],
  ];

  return (
    <div className="space-y-4">
      <ResultBanner
        label="Wynik rozliczenia mediów"
        title={utilityResultTitle(totalAmount)}
        amount={totalAmount}
      >
        <dl className="flex flex-wrap gap-10">
          {sums.map(([term, amount]) => (
            <div key={term}>
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="text-xl font-semibold">
                {formatCurrency(amount)}
              </dd>
            </div>
          ))}
        </dl>
      </ResultBanner>
      {utilities.map((utility) => (
        <UtilityCard key={utility.code} utility={utility} />
      ))}
      {(otherLines.length > 0 || otherMeters.length > 0) && (
        <OtherEntriesCard lines={otherLines} meters={otherMeters} />
      )}
      <DocumentDetails {...settlement} />
    </div>
  );
}
