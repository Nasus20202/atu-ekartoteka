import { isWithinTolerance } from '@/lib/settlements/rules/amounts';
import { groupByCode } from '@/lib/settlements/rules/group-by-code';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';
import {
  type IssueContext,
  warningIssue,
} from '@/lib/settlements/validation/issues';
import { formatCurrency, formatQuantity } from '@/lib/shared/utils';
import { sumDecimals } from '@/lib/shared/utils/sum';

function roundingWarnings(
  record: ParsedUtilityRecord,
  context: IssueContext
): SettlementIssue[] {
  const warn = (message: string, page?: number) =>
    warningIssue({ ...context, page }, 'rounding', message);
  const lines = record.lines
    .filter((l) => !isWithinTolerance(l.quantity.times(l.unitPrice), l.amount))
    .map((l) =>
      warn(
        `„${l.description}”: ${formatQuantity(l.quantity)} × ${formatCurrency(l.unitPrice)} to nie ${formatCurrency(l.amount)}.`
      )
    );
  const totals = record.pageTotals
    .filter((p) => !isWithinTolerance(p.total, p.summarySum))
    .map((p) =>
      warn(
        `suma ${formatCurrency(p.total)} różni się od sumy podsumowania ${formatCurrency(p.summarySum)}.`,
        p.page
      )
    );
  return [...lines, ...totals];
}

/** Findings that are reported but do not block the import. */
export function checkUtilityWarnings(
  record: ParsedUtilityRecord,
  context: IssueContext
): SettlementIssue[] {
  const codes = [...new Set(record.summaries.map((s) => s.code))];
  const ungrouped = record.lines.filter(
    (line) => groupByCode(line.description, codes) === null
  );
  const issues = roundingWarnings(record, context);

  if (ungrouped.length > 0) {
    const names = [...new Set(ungrouped.map((l) => `„${l.description}”`))];
    issues.push(
      warningIssue(
        context,
        'ungrouped',
        `nie można przypisać pozycji ${names.join(', ')} do medium. Pominięto porównania ilości i kwot z podsumowaniem, licznikami i naliczeniami.`
      )
    );
    return issues;
  }

  for (const code of codes) {
    const of = (kind: string) =>
      record.lines.filter(
        (l) => l.kind === kind && groupByCode(l.description, codes) === code
      );
    const calculated = sumDecimals(
      of('CONSUMPTION').map((l) => l.amount)
    ).minus(sumDecimals(of('ADVANCE').map((l) => l.amount)));
    const stated = sumDecimals(
      record.summaries.filter((s) => s.code === code).map((s) => s.amount)
    );
    if (!isWithinTolerance(calculated, stated)) {
      issues.push(
        warningIssue(
          context,
          'rounding',
          `${code}: kwota rozliczenia ${formatCurrency(stated)} różni się od różnicy pozycji ${formatCurrency(calculated)}.`
        )
      );
    }

    const meters = record.readings.filter(
      (r) => groupByCode(r.device, codes) === code
    );
    const billed = sumDecimals(of('CONSUMPTION').map((l) => l.quantity));
    const metered = sumDecimals(meters.map((r) => r.consumption));
    if (meters.length > 0 && !billed.equals(metered)) {
      issues.push(
        warningIssue(
          context,
          'meter-billed',
          `${code}: rozliczone zużycie ${formatQuantity(billed)}, zużycie według liczników ${formatQuantity(metered)}.`
        )
      );
    }
    const units = new Set(meters.map((r) => r.unit));
    if (units.size > 1) {
      issues.push(
        warningIssue(
          context,
          'meter-billed',
          `${code}: liczniki w różnych jednostkach (${[...units].join(', ')}).`
        )
      );
    }
  }

  return issues;
}
