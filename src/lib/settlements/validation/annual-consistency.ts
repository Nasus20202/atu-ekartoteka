import { isWithinTolerance } from '@/lib/settlements/rules/amounts';
import type {
  AnnualItem,
  AnnualOwnerTotal,
  ParsedAnnualRecord,
} from '@/lib/settlements/types/annual-settlement';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import {
  errorIssue,
  type IssueContext,
  warningIssue,
} from '@/lib/settlements/validation/issues';
import {
  COLUMN_PRECISION,
  fitsColumn,
} from '@/lib/settlements/validation/precision';
import { formatCurrency, formatQuantity } from '@/lib/shared/utils';

function itemWarnings(item: AnnualItem, context: IssueContext) {
  const warn = (message: string) =>
    warningIssue(
      { ...context, page: item.page },
      'rounding',
      `„${item.basisDescription}”: ${message}`
    );
  if (item.communityBasis.isZero()) {
    return [warn('nie można sprawdzić wyliczenia, podstawa wspólnoty to 0.')];
  }
  const issues: SettlementIssue[] = [];
  const expected = item.communityAmount
    .times(item.flatBasis)
    .dividedBy(item.communityBasis);
  if (!isWithinTolerance(item.amount, expected)) {
    issues.push(
      warn(
        `kwota ${formatCurrency(item.amount)} różni się od wyliczonej ${formatCurrency(expected)}.`
      )
    );
  }
  const coefficient = item.flatBasis
    .dividedBy(item.communityBasis)
    .toDecimalPlaces(COLUMN_PRECISION.coefficient.places);
  if (!coefficient.equals(item.coefficient)) {
    issues.push(
      warn(
        `współczynnik ${formatQuantity(item.coefficient)} różni się od wyliczonego ${formatQuantity(coefficient)}.`
      )
    );
  }
  return issues;
}

/** Checks one record against its own printed figures. */
export function checkAnnualRecord(
  record: ParsedAnnualRecord,
  context: IssueContext
): SettlementIssue[] {
  const seen = new Set<string>();
  const issues: SettlementIssue[] = [];

  for (const item of record.items) {
    const key = JSON.stringify([
      item.title,
      item.basisDescription,
      item.periodFrom,
      item.periodTo,
    ]);
    if (seen.has(key)) {
      issues.push(
        errorIssue(
          { ...context, page: item.page },
          'inconsistent',
          `pozycja „${item.title}” występuje dwa razy.`
        )
      );
    }
    seen.add(key);

    const storable =
      fitsColumn(item.coefficient, 'coefficient') &&
      [
        item.communityAmount,
        item.flatBasis,
        item.communityBasis,
        item.amount,
      ].every((value) => fitsColumn(value, 'amount'));
    if (!storable) {
      issues.push(
        errorIssue(
          { ...context, page: item.page },
          'unstorable',
          `pozycja „${item.title}” ma wartości dokładniejsze lub większe, niż można zapisać.`
        )
      );
    }
    issues.push(...itemWarnings(item, context));
  }

  for (const total of record.apartmentTotals) {
    if (!isWithinTolerance(total.total, total.itemSum)) {
      issues.push(
        warningIssue(
          { ...context, page: total.page },
          'rounding',
          `suma lokalu ${formatCurrency(total.total)} różni się od sumy pozycji ${formatCurrency(total.itemSum)}.`
        )
      );
    }
  }
  return issues;
}

/** An owner total must add up from the owner's apartment totals. */
export function checkOwnerTotals(
  totals: AnnualOwnerTotal[],
  fileName: string
): SettlementIssue[] {
  return totals
    .filter((t) => !isWithinTolerance(t.total, t.apartmentSum))
    .map((t) =>
      errorIssue(
        { fileName, page: t.page, subject: t.printedOwner },
        'inconsistent',
        `suma właściciela ${formatCurrency(t.total)} różni się od sumy lokali ${formatCurrency(t.apartmentSum)}.`
      )
    );
}
