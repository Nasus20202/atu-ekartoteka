import { formatDay, formatSpan } from '@/lib/settlements/rules/format';
import { dateToIso } from '@/lib/settlements/rules/periods';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type {
  ApartmentCandidate,
  StoredPeriod,
  StoredReading,
} from '@/lib/settlements/types/stored-data';
import type { MeterRow } from '@/lib/settlements/types/utility-settlement';
import {
  errorIssue,
  type IssueContext,
  warningIssue,
} from '@/lib/settlements/validation/issues';
import { formatQuantity } from '@/lib/shared/utils';

/** `overlapping` are other stored periods of the apartment that share days. */
export function checkOverlap(
  overlapping: StoredPeriod[],
  context: IssueContext
): SettlementIssue[] {
  return overlapping.map((stored) =>
    errorIssue(
      context,
      'overlap',
      `okres nakłada się na zapisane rozliczenie ${formatSpan(stored.periodFrom, stored.periodTo)}.`
    )
  );
}

/** A meter ends where it starts next time, and stays in one apartment. */
export function checkMeterHistory(
  readings: MeterRow[],
  stored: StoredReading[],
  externalApartmentId: string,
  context: IssueContext
): SettlementIssue[] {
  return readings.flatMap((reading) => {
    const sameMeter = stored.filter(
      (s) => s.serialNumber === reading.serialNumber
    );
    const gap = (date: string, here: string, there: string) =>
      warningIssue(
        context,
        'continuity',
        `licznik ${reading.serialNumber}: odczyt z ${formatDay(date)} w pliku ${here}, w zapisanym rozliczeniu ${there}.`
      );
    const issues = sameMeter.flatMap((s) => [
      ...(s.endDate === reading.startDate &&
      !s.endValue.equals(reading.startValue)
        ? [
            gap(
              reading.startDate,
              formatQuantity(reading.startValue),
              formatQuantity(s.endValue)
            ),
          ]
        : []),
      ...(s.startDate === reading.endDate &&
      !s.startValue.equals(reading.endValue)
        ? [
            gap(
              reading.endDate,
              formatQuantity(reading.endValue),
              formatQuantity(s.startValue)
            ),
          ]
        : []),
    ]);
    const elsewhere = sameMeter.find(
      (s) => s.externalApartmentId !== externalApartmentId
    );
    return elsewhere
      ? [
          ...issues,
          warningIssue(
            context,
            'serial',
            `licznik ${reading.serialNumber} jest zapisany dla lokalu ${elsewhere.externalApartmentId}.`
          ),
        ]
      : issues;
  });
}

export function checkOwnerPeriod(
  { validFrom, validTo }: ApartmentCandidate,
  period: StoredPeriod,
  context: IssueContext
): SettlementIssue[] {
  const from = validFrom && dateToIso(validFrom);
  const to = validTo && dateToIso(validTo);
  const outside =
    (from && period.periodFrom < from) || (to && period.periodTo > to);

  return outside
    ? [
        warningIssue(
          context,
          'owner-period',
          `okres wykracza poza daty właściciela (od ${from ? formatDay(from) : '—'} do ${to ? formatDay(to) : '—'}).`
        ),
      ]
    : [];
}
