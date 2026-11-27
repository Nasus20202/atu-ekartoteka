import { findMeterHistory } from '@/lib/settlements/queries/find-meter-history';
import {
  findApartmentCharges,
  findCommunityCharges,
} from '@/lib/settlements/queries/find-settlement-charges';
import { findOverlappingPeriods } from '@/lib/settlements/queries/find-stored-periods';
import { allocationPeriod } from '@/lib/settlements/rules/charge-names';
import { monthsBetween, yearOf } from '@/lib/settlements/rules/periods';
import type { MatchedRecord } from '@/lib/settlements/types/prepared-file';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type {
  ApartmentCandidate,
  ReplacedPeriods,
} from '@/lib/settlements/types/stored-data';
import { checkAnnualCharges } from '@/lib/settlements/validation/annual-charges';
import type { IssueContext } from '@/lib/settlements/validation/issues';
import {
  checkMeterHistory,
  checkOverlap,
  checkOwnerPeriod,
} from '@/lib/settlements/validation/stored-checks';
import { checkUtilityCharges } from '@/lib/settlements/validation/utility-charges';

async function checkUtilityRecordCharges(
  entry: Extract<MatchedRecord, { type: 'utility' }>,
  apartment: ApartmentCandidate,
  context: IssueContext
): Promise<SettlementIssue[]> {
  const { periodFrom, periodTo } = entry.record;
  const charges = await findApartmentCharges(
    apartment.id,
    monthsBetween(periodFrom, periodTo)
  );
  return checkUtilityCharges(entry.record, charges, context);
}

async function checkAnnualRecordCharges(
  entry: Extract<MatchedRecord, { type: 'annual' }>,
  apartment: ApartmentCandidate,
  context: IssueContext
): Promise<SettlementIssue[]> {
  const { periodFrom, periodTo, items } = entry.record;
  const charges = await findApartmentCharges(apartment.id, [
    ...monthsBetween(periodFrom, periodTo),
    // The yearly allocation can be booked after a partial period
    allocationPeriod(periodTo),
  ]);
  // Items of one year share the association's charges
  const years = [...new Set(items.map((item) => yearOf(item.periodTo)))];
  const community = new Map(
    await Promise.all(
      years.map(
        async (year) =>
          [
            year,
            await findCommunityCharges(apartment.homeownersAssociationId, year),
          ] as const
      )
    )
  );

  return items.flatMap((item) =>
    checkAnnualCharges(
      item,
      charges,
      community.get(yearOf(item.periodTo)) ?? [],
      context
    )
  );
}

function checkCharges(
  entry: MatchedRecord,
  apartment: ApartmentCandidate,
  context: IssueContext
): Promise<SettlementIssue[]> {
  return entry.type === 'utility'
    ? checkUtilityRecordCharges(entry, apartment, context)
    : checkAnnualRecordCharges(entry, apartment, context);
}

/**
 * Compares a matched record with the stored charges and settlements, leaving out
 * the settlements a clean import removes.
 */
export async function checkRecordAgainstData(
  entry: MatchedRecord,
  apartment: ApartmentCandidate,
  context: IssueContext,
  replaced: ReplacedPeriods[] = []
): Promise<SettlementIssue[]> {
  const issues = [
    ...checkOwnerPeriod(apartment, entry.record, context),
    ...checkOverlap(
      await findOverlappingPeriods(
        entry.type,
        apartment.id,
        entry.record,
        replaced
      ),
      context
    ),
    ...(await checkCharges(entry, apartment, context)),
  ];
  if (entry.type !== 'utility') return issues;

  const history = await findMeterHistory(
    entry.record.readings,
    apartment,
    entry.record,
    replaced
  );
  return [
    ...issues,
    ...checkMeterHistory(
      entry.record.readings,
      history,
      apartment.externalApartmentId,
      context
    ),
  ];
}
