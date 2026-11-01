import {
  CROSS_CHARGES_TOLERANCE,
  MONTHLY_CHARGES_IGNORED_NOTE,
  SETTLEMENT_DESCRIPTION_PREFIX,
} from '@/lib/import/constants';
import type { ImportWarning } from '@/lib/import/types';
import type { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import type { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import { type Decimal, toDecimal } from '@/lib/utils/decimal';

interface MonthLines {
  total: Decimal;
  settlement: Decimal;
  // Negative lines that are not settlements, summed per description
  credits: Map<string, Decimal>;
}

// Same owner#apartment identity as the importers, plus the YYYYMM period
function makeCrossFileKey(
  ownerId: string,
  apartmentId: string,
  period: string
): string {
  return `${ownerId}#${apartmentId}|${period}`;
}

function isSettlementLine(entry: NalCzynszEntry): boolean {
  return entry.description
    .trim()
    .toLowerCase()
    .startsWith(SETTLEMENT_DESCRIPTION_PREFIX);
}

function emptyMonth(): MonthLines {
  return { total: toDecimal(0), settlement: toDecimal(0), credits: new Map() };
}

function collectMonthLines(
  nalEntries: NalCzynszEntry[]
): Map<string, MonthLines> {
  const months = new Map<string, MonthLines>();

  for (const entry of nalEntries) {
    const key = makeCrossFileKey(
      entry.id,
      entry.apartmentExternalId,
      entry.period
    );
    const month = months.get(key) ?? emptyMonth();
    const amount = toDecimal(entry.totalAmount);

    month.total = month.total.plus(amount);
    if (isSettlementLine(entry)) {
      month.settlement = month.settlement.plus(amount);
    } else if (amount.isNegative()) {
      const description = entry.description.trim();
      month.credits.set(
        description,
        (month.credits.get(description) ?? toDecimal(0)).plus(amount)
      );
    }
    months.set(key, month);
  }

  return months;
}

function formatCredits(credits: Map<string, Decimal>): string {
  return Array.from(
    credits,
    ([description, amount]) => `${description} ${amount.toFixed(2)}`
  ).join(', ');
}

function describeGap(
  difference: Decimal,
  unexplained: Decimal,
  explained: boolean,
  credits: Map<string, Decimal>
): string {
  if (explained) {
    return `(różnica ${difference.toFixed(2)} równa wyrównaniom)`;
  }
  if (!unexplained.isNegative() || credits.size === 0) {
    return `(niewyjaśniona różnica ${unexplained.toFixed(2)})`;
  }
  return (
    `(niewyjaśniona różnica ${unexplained.toFixed(2)}; ` +
    `ujemne pozycje bez wyrównań: ${formatCredits(credits)})`
  );
}

// One warning per owner, apartment and year listing every differing month
export function validateChargesCrossFile(
  nalEntries: NalCzynszEntry[],
  paymentEntries: PaymentEntry[]
): ImportWarning[] {
  const warnings: ImportWarning[] = [];
  const monthLines = collectMonthLines(nalEntries);

  for (const payment of paymentEntries) {
    const months: string[] = [];
    let totalDifference = toDecimal(0);
    let explainedBySettlement = 0;

    for (let i = 0; i < payment.monthlyCharges.length; i++) {
      const monthlyCharge = toDecimal(payment.monthlyCharges[i]);
      const period = `${payment.year}${String(i + 1).padStart(2, '0')}`;
      const key = makeCrossFileKey(
        payment.externalId,
        payment.apartmentCode,
        period
      );
      const lines = monthLines.get(key) ?? emptyMonth();
      const nalSum = lines.total;

      // Skip months where both sides are zero
      if (monthlyCharge.isZero() && nalSum.isZero()) continue;

      const delta = monthlyCharge.sub(nalSum).abs();
      if (!delta.greaterThan(CROSS_CHARGES_TOLERANCE)) continue;

      const difference = nalSum.minus(monthlyCharge);
      const unexplained = difference.minus(lines.settlement);
      const explained =
        !lines.settlement.isZero() &&
        unexplained.abs().lessThanOrEqualTo(CROSS_CHARGES_TOLERANCE);
      if (explained) explainedBySettlement++;

      months.push(
        `${period}: suma naliczeń ${nalSum.toFixed(2)} ≠ naliczenia z wpłat ${monthlyCharge.toFixed(2)} ` +
          describeGap(difference, unexplained, explained, lines.credits)
      );
      totalDifference = totalDifference.plus(delta);
    }

    if (months.length > 0) {
      warnings.push({
        kind: 'charges-mismatch',
        apartmentExternalId: payment.apartmentCode,
        year: payment.year,
        difference: totalDifference.toFixed(4),
        months: { differing: months.length, explainedBySettlement },
        message:
          `Lokal ${payment.apartmentCode} (właściciel ${payment.externalId}), rok ${payment.year}: ` +
          `${months.length} mies. z różnicą — ${months.join('; ')}. ` +
          MONTHLY_CHARGES_IGNORED_NOTE,
      });
    }
  }

  return warnings;
}
