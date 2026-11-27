import { CROSS_CHARGES_TOLERANCE } from '@/lib/import/rules/constants';
import { isWithinTolerance } from '@/lib/settlements/rules/amounts';
import {
  allocationPeriod,
  basisChargeNames,
} from '@/lib/settlements/rules/charge-names';
import { comparableText } from '@/lib/settlements/rules/normalize-text';
import { monthsBetween } from '@/lib/settlements/rules/periods';
import type { AnnualItem } from '@/lib/settlements/types/annual-settlement';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type {
  ChargeRow,
  CommunityCharges,
} from '@/lib/settlements/types/stored-data';
import {
  errorIssue,
  type IssueContext,
  warningIssue,
} from '@/lib/settlements/validation/issues';
import { formatCurrency, formatPeriod } from '@/lib/shared/utils';
import { sumDecimals } from '@/lib/shared/utils/sum';

/**
 * The December allocation of the apartment that books the item's amount. There
 * may be none, e.g. when the amount was set off against an overpayment.
 */
function findAllocation(item: AnnualItem, charges: ChargeRow[]) {
  const period = allocationPeriod(item.periodTo);
  const basis = comparableText(item.basisDescription);
  return charges
    .filter(
      (c) =>
        c.period === period &&
        c.unitPrice.equals(1) &&
        comparableText(c.description) === basis &&
        isWithinTolerance(c.totalAmount, item.amount)
    )
    .sort((a, b) =>
      a.totalAmount
        .minus(item.amount)
        .abs()
        .comparedTo(b.totalAmount.minus(item.amount).abs())
    )[0];
}

/**
 * Compares one item with the apartment's charges and the community's charges of
 * the year.
 */
export function checkAnnualCharges(
  item: AnnualItem,
  charges: ChargeRow[],
  community: CommunityCharges[],
  itemContext: IssueContext
): SettlementIssue[] {
  const context = { ...itemContext, page: item.page };
  const label = `„${item.basisDescription}”`;
  const basis = comparableText(item.basisDescription);
  const allocated = community.some(
    (c) => c.allocated && comparableText(c.description) === basis
  );
  if (!allocated) {
    return [
      warningIssue(
        context,
        'not-verified',
        `${label}: nie zweryfikowano, brak naliczeń rozliczeniowych wspólnoty za ${formatPeriod(allocationPeriod(item.periodTo))}.`
      ),
    ];
  }

  const issues: SettlementIssue[] = [];
  const allocation = findAllocation(item, charges);
  const names = basisChargeNames(item.basisDescription);
  const months = new Set(monthsBetween(item.periodFrom, item.periodTo));
  const flat = sumDecimals(
    charges
      .filter(
        (c) =>
          c !== allocation &&
          months.has(c.period) &&
          names.has(comparableText(c.description))
      )
      .map((c) => c.totalAmount)
  );
  if (!isWithinTolerance(flat, item.flatBasis)) {
    issues.push(
      errorIssue(
        context,
        'charges',
        `${label}: podstawa lokalu w pliku ${formatCurrency(item.flatBasis)}, w naliczeniach ${formatCurrency(flat)}.`
      )
    );
  }

  const total = sumDecimals(
    community
      .filter((c) => names.has(comparableText(c.description)))
      .map((c) => c.total)
  );
  const stated = item.communityBasis.plus(item.communityAmount);
  if (!isWithinTolerance(total, stated, CROSS_CHARGES_TOLERANCE)) {
    issues.push(
      warningIssue(
        context,
        'community',
        `${label}: podstawa i kwota wspólnoty razem ${formatCurrency(stated)}, w naliczeniach wspólnoty ${formatCurrency(total)}.`
      )
    );
  }
  return issues;
}
