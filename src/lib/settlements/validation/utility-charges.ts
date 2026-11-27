import type { UtilitySettlementLineKind } from '@/generated/prisma/browser';
import { isWithinTolerance } from '@/lib/settlements/rules/amounts';
import { isAllocationShaped } from '@/lib/settlements/rules/charge-names';
import { groupByCode } from '@/lib/settlements/rules/group-by-code';
import { comparableText } from '@/lib/settlements/rules/normalize-text';
import { monthsBetween } from '@/lib/settlements/rules/periods';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type { ChargeRow } from '@/lib/settlements/types/stored-data';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';
import {
  errorIssue,
  type IssueContext,
  warningIssue,
} from '@/lib/settlements/validation/issues';
import {
  formatCurrency,
  formatPeriod,
  formatQuantity,
} from '@/lib/shared/utils';
import { sumDecimals } from '@/lib/shared/utils/sum';

/**
 * The settlement repeats what was charged: the advances, and the difference
 * booked under the names of its consumption lines.
 */
export function checkUtilityCharges(
  record: ParsedUtilityRecord,
  charges: ChargeRow[],
  context: IssueContext
): SettlementIssue[] {
  const codes = [...new Set(record.summaries.map((s) => s.code))];
  // Reported as a warning with the other findings of the file
  if (record.lines.some((l) => groupByCode(l.description, codes) === null)) {
    return [];
  }

  const charged = new Set(charges.map((c) => c.period));
  const missing = monthsBetween(record.periodFrom, record.periodTo).filter(
    (month) => !charged.has(month)
  );
  if (missing.length > 0) {
    return [
      warningIssue(
        context,
        'not-verified',
        `nie zweryfikowano z naliczeniami, brak naliczeń za: ${missing.map(formatPeriod).join(', ')}.`
      ),
    ];
  }

  const regular = charges.filter((c) => !isAllocationShaped(c));

  return codes.flatMap((code) => {
    const rows = record.summaries.filter((s) => s.code === code);
    const chargesOf = (kind: UtilitySettlementLineKind) => {
      const names = new Set(
        record.lines
          .filter(
            (l) => l.kind === kind && groupByCode(l.description, codes) === code
          )
          .map((l) => comparableText(l.description))
      );
      return regular.filter((c) => names.has(comparableText(c.description)));
    };
    const advances = sumDecimals(chargesOf('ADVANCE').map((c) => c.quantity));
    const settled = chargesOf('CONSUMPTION');
    const difference = sumDecimals(settled.map((c) => c.quantity));
    const amount = sumDecimals(settled.map((c) => c.totalAmount));
    const messages: string[] = [];

    const stated = {
      advances: sumDecimals(rows.map((r) => r.advanceQuantity)),
      difference: sumDecimals(rows.map((r) => r.difference)),
      amount: sumDecimals(rows.map((r) => r.amount)),
    };
    if (!advances.equals(stated.advances)) {
      messages.push(
        `ilość zaliczek w pliku ${formatQuantity(stated.advances)}, w naliczeniach ${formatQuantity(advances)}.`
      );
    }
    if (!difference.equals(stated.difference)) {
      messages.push(
        `różnica ilości w pliku ${formatQuantity(stated.difference)}, w naliczeniach ${formatQuantity(difference)}.`
      );
    }
    if (!isWithinTolerance(amount, stated.amount)) {
      messages.push(
        `kwota rozliczenia w pliku ${formatCurrency(stated.amount)}, w naliczeniach ${formatCurrency(amount)}.`
      );
    }
    return messages.map((m) => errorIssue(context, 'charges', `${code}: ${m}`));
  });
}
