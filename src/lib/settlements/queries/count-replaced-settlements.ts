import { prisma } from '@/lib/platform/database/prisma';
import { replacedWhere } from '@/lib/settlements/queries/replaced-where';
import type { ReplacedPeriods } from '@/lib/settlements/types/stored-data';

/** How many stored settlements a clean import of these periods would remove. */
export async function countReplacedSettlements(
  replaced: ReplacedPeriods[]
): Promise<number> {
  const counts = await Promise.all(
    replaced.map((scope) => {
      const query = { where: replacedWhere(scope) };
      return scope.type === 'utility'
        ? prisma.utilitySettlement.count(query)
        : prisma.annualCostSettlement.count(query);
    })
  );
  return counts.reduce((total, count) => total + count, 0);
}
