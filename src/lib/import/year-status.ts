import type {
  ImportWarning,
  YearBalanceRow,
  YearStatus,
} from '@/lib/import/types';
import type { YearBalanceSummary } from '@/lib/import/year-balance-overview';
import { periodToYear } from '@/lib/utils/period';

/** Year a warning belongs to; undefined when it applies to the whole HOA. */
function warningYear(warning: ImportWarning): number | undefined {
  if (warning.year !== undefined) return warning.year;
  return warning.period ? periodToYear(warning.period) : undefined;
}

/**
 * Marks each year as ok, warning or error. An error without a year marks all
 * years of the HOA; an error with a year marks that year. A warning without a
 * year applies to every year. A closing mismatch counts against both the year
 * it closes and the year it opens.
 */
export function withYearStatus(
  rows: YearBalanceSummary[],
  errors: string[],
  errorYears: number[],
  warnings: ImportWarning[]
): YearBalanceRow[] {
  const sharedErrorCount = errors.length - errorYears.length;

  return rows.map((row, index) => {
    const warningCount = warnings.filter((warning) => {
      const year = warningYear(warning);
      return year === undefined || year === row.year;
    }).length;
    const mismatchCount =
      (row.closingMismatch ? 1 : 0) +
      (index > 0 && rows[index - 1].closingMismatch ? 1 : 0);
    const issueCount = warningCount + mismatchCount;

    let status: YearStatus = 'ok';
    if (sharedErrorCount > 0 || errorYears.includes(row.year)) status = 'error';
    else if (issueCount > 0) status = 'warning';

    return { ...row, issueCount, status };
  });
}
