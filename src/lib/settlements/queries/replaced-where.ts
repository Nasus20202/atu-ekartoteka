import { isoToDate } from '@/lib/settlements/rules/periods';
import type { ReplacedPeriods } from '@/lib/settlements/types/stored-data';

/** The stored settlements of one scope of a clean import. */
export const replacedWhere = ({
  homeownersAssociationId,
  periods,
}: ReplacedPeriods) => ({
  apartment: { homeownersAssociationId },
  OR: periods.map(({ periodFrom, periodTo }) => ({
    periodFrom: isoToDate(periodFrom),
    periodTo: isoToDate(periodTo),
  })),
});
