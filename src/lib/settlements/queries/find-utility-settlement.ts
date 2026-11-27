import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/platform/database/prisma';
import { toUtilityDto } from '@/lib/settlements/dto/settlement-view-mapper';
import { toDecimal } from '@/lib/shared/utils/decimal';

/** One utility settlement inside the scope, with sums added up in the database. */
export async function findUtilitySettlement(
  where: Prisma.UtilitySettlementWhereInput
) {
  const row = await prisma.utilitySettlement.findFirst({
    where,
    include: {
      lines: { orderBy: { lineNo: 'asc' } },
      readings: { orderBy: { lineNo: 'asc' } },
    },
  });
  if (!row) return null;

  const settlementId = row.id;
  const [byKind, byCode] = await Promise.all([
    prisma.utilitySettlementLine.groupBy({
      by: ['kind'],
      where: { settlementId },
      _sum: { amount: true },
    }),
    prisma.utilitySettlementSummary.groupBy({
      by: ['code'],
      where: { settlementId },
      _sum: {
        consumption: true,
        advanceQuantity: true,
        difference: true,
        amount: true,
      },
      // Codes keep the order in which the printout lists them
      orderBy: { _min: { lineNo: 'asc' } },
    }),
  ]);
  const amountOf = (kind: string) =>
    toDecimal(byKind.find((sums) => sums.kind === kind)?._sum.amount ?? 0);

  return toUtilityDto(
    row,
    byCode.map(({ code, _sum }) => ({
      code,
      consumption: toDecimal(_sum.consumption ?? 0),
      advanceQuantity: toDecimal(_sum.advanceQuantity ?? 0),
      difference: toDecimal(_sum.difference ?? 0),
      amount: toDecimal(_sum.amount ?? 0),
    })),
    {
      advanceAmount: amountOf('ADVANCE'),
      consumptionAmount: amountOf('CONSUMPTION'),
    }
  );
}
