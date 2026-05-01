import { Prisma } from '@/generated/prisma/client';
import { IMPORT_CREATE_BATCH_SIZE } from '@/lib/import/constants';
import { EntityStats, TransactionClient } from '@/lib/import/types';
import { processInBatches } from '@/lib/import/utils';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import { toDecimal } from '@/lib/utils/decimal';

type PaymentKey = {
  apartmentId: string;
  year: number;
};

type ExistingPayment = PaymentKey & {
  id: string;
  dateFrom: Date;
  dateTo: Date;
  openingDebt: Prisma.Decimal;
  openingSurplus: Prisma.Decimal;
  openingBalance: Prisma.Decimal;
  closingBalance: Prisma.Decimal;
  januaryPayments: Prisma.Decimal;
  februaryPayments: Prisma.Decimal;
  marchPayments: Prisma.Decimal;
  aprilPayments: Prisma.Decimal;
  mayPayments: Prisma.Decimal;
  junePayments: Prisma.Decimal;
  julyPayments: Prisma.Decimal;
  augustPayments: Prisma.Decimal;
  septemberPayments: Prisma.Decimal;
  octoberPayments: Prisma.Decimal;
  novemberPayments: Prisma.Decimal;
  decemberPayments: Prisma.Decimal;
  januaryCharges: Prisma.Decimal;
  februaryCharges: Prisma.Decimal;
  marchCharges: Prisma.Decimal;
  aprilCharges: Prisma.Decimal;
  mayCharges: Prisma.Decimal;
  juneCharges: Prisma.Decimal;
  julyCharges: Prisma.Decimal;
  augustCharges: Prisma.Decimal;
  septemberCharges: Prisma.Decimal;
  octoberCharges: Prisma.Decimal;
  novemberCharges: Prisma.Decimal;
  decemberCharges: Prisma.Decimal;
};

function makePaymentKey(p: PaymentKey): string {
  return `${p.apartmentId}|${p.year}`;
}

function hasPaymentChanged(
  existing: ExistingPayment,
  entry: PaymentEntry
): boolean {
  const [
    janP,
    febP,
    marP,
    aprP,
    mayP,
    junP,
    julP,
    augP,
    sepP,
    octP,
    novP,
    decP,
  ] = entry.monthlyPayments;
  const [
    janC,
    febC,
    marC,
    aprC,
    mayC,
    junC,
    julC,
    augC,
    sepC,
    octC,
    novC,
    decC,
  ] = entry.monthlyCharges;

  return (
    existing.dateFrom.getTime() !== entry.dateFrom.getTime() ||
    existing.dateTo.getTime() !== entry.dateTo.getTime() ||
    !toDecimal(existing.openingDebt).equals(toDecimal(entry.openingDebt)) ||
    !toDecimal(existing.openingSurplus).equals(
      toDecimal(entry.openingSurplus)
    ) ||
    !toDecimal(existing.openingBalance).equals(
      toDecimal(entry.openingBalance)
    ) ||
    !toDecimal(existing.closingBalance).equals(
      toDecimal(entry.closingBalance)
    ) ||
    !toDecimal(existing.januaryPayments).equals(toDecimal(janP)) ||
    !toDecimal(existing.februaryPayments).equals(toDecimal(febP)) ||
    !toDecimal(existing.marchPayments).equals(toDecimal(marP)) ||
    !toDecimal(existing.aprilPayments).equals(toDecimal(aprP)) ||
    !toDecimal(existing.mayPayments).equals(toDecimal(mayP)) ||
    !toDecimal(existing.junePayments).equals(toDecimal(junP)) ||
    !toDecimal(existing.julyPayments).equals(toDecimal(julP)) ||
    !toDecimal(existing.augustPayments).equals(toDecimal(augP)) ||
    !toDecimal(existing.septemberPayments).equals(toDecimal(sepP)) ||
    !toDecimal(existing.octoberPayments).equals(toDecimal(octP)) ||
    !toDecimal(existing.novemberPayments).equals(toDecimal(novP)) ||
    !toDecimal(existing.decemberPayments).equals(toDecimal(decP)) ||
    !toDecimal(existing.januaryCharges).equals(toDecimal(janC)) ||
    !toDecimal(existing.februaryCharges).equals(toDecimal(febC)) ||
    !toDecimal(existing.marchCharges).equals(toDecimal(marC)) ||
    !toDecimal(existing.aprilCharges).equals(toDecimal(aprC)) ||
    !toDecimal(existing.mayCharges).equals(toDecimal(mayC)) ||
    !toDecimal(existing.juneCharges).equals(toDecimal(junC)) ||
    !toDecimal(existing.julyCharges).equals(toDecimal(julC)) ||
    !toDecimal(existing.augustCharges).equals(toDecimal(augC)) ||
    !toDecimal(existing.septemberCharges).equals(toDecimal(sepC)) ||
    !toDecimal(existing.octoberCharges).equals(toDecimal(octC)) ||
    !toDecimal(existing.novemberCharges).equals(toDecimal(novC)) ||
    !toDecimal(existing.decemberCharges).equals(toDecimal(decC))
  );
}

export async function importPayments(
  tx: TransactionClient,
  apartmentMap: Map<string, string>,
  entries: PaymentEntry[],
  stats: EntityStats,
  errors: string[]
): Promise<void> {
  // Filter entries with valid apartment IDs (using combined key: externalOwnerId#externalApartmentId)
  const validEntries: Array<{ entry: PaymentEntry; apartmentId: string }> = [];
  const apartmentIds = new Set<string>();
  const years = new Set<number>();

  for (const entry of entries) {
    const apartmentId = apartmentMap.get(
      `${entry.externalId}#${entry.apartmentCode}`
    );
    if (!apartmentId) {
      continue;
    }

    validEntries.push({ entry, apartmentId });
    apartmentIds.add(apartmentId);
    years.add(entry.year);
  }

  stats.skipped = entries.length - validEntries.length;

  if (validEntries.length === 0) return;

  const existingPayments = await tx.payment.findMany({
    where: {
      apartmentId: { in: Array.from(apartmentIds) },
      year: { in: Array.from(years) },
    },
    select: {
      id: true,
      apartmentId: true,
      year: true,
      dateFrom: true,
      dateTo: true,
      openingDebt: true,
      openingSurplus: true,
      openingBalance: true,
      closingBalance: true,
      januaryPayments: true,
      februaryPayments: true,
      marchPayments: true,
      aprilPayments: true,
      mayPayments: true,
      junePayments: true,
      julyPayments: true,
      augustPayments: true,
      septemberPayments: true,
      octoberPayments: true,
      novemberPayments: true,
      decemberPayments: true,
      januaryCharges: true,
      februaryCharges: true,
      marchCharges: true,
      aprilCharges: true,
      mayCharges: true,
      juneCharges: true,
      julyCharges: true,
      augustCharges: true,
      septemberCharges: true,
      octoberCharges: true,
      novemberCharges: true,
      decemberCharges: true,
    },
  });

  const existingMap = new Map<string, ExistingPayment>(
    existingPayments.map((p: ExistingPayment) => [makePaymentKey(p), p])
  );

  const toCreate: Array<{ entry: PaymentEntry; apartmentId: string }> = [];
  const toUpdate: Array<{ id: string; entry: PaymentEntry }> = [];

  for (const { entry, apartmentId } of validEntries) {
    const key = makePaymentKey({
      apartmentId,
      year: entry.year,
    });
    const existing = existingMap.get(key);

    if (existing) {
      if (hasPaymentChanged(existing, entry)) {
        toUpdate.push({ id: existing.id, entry });
      }
      // If not changed, skip
    } else {
      toCreate.push({ entry, apartmentId });
    }
  }

  // Batch create new payments
  if (toCreate.length > 0) {
    try {
      await processInBatches(
        toCreate,
        IMPORT_CREATE_BATCH_SIZE,
        async (batch) => {
          await tx.payment.createMany({
            data: batch.map(({ entry, apartmentId }) => {
              const [
                janP,
                febP,
                marP,
                aprP,
                mayP,
                junP,
                julP,
                augP,
                sepP,
                octP,
                novP,
                decP,
              ] = entry.monthlyPayments;
              const [
                janC,
                febC,
                marC,
                aprC,
                mayC,
                junC,
                julC,
                augC,
                sepC,
                octC,
                novC,
                decC,
              ] = entry.monthlyCharges;
              return {
                apartmentId,
                year: entry.year,
                dateFrom: entry.dateFrom,
                dateTo: entry.dateTo,
                openingDebt: entry.openingDebt,
                openingSurplus: entry.openingSurplus,
                openingBalance: entry.openingBalance,
                closingBalance: entry.closingBalance,
                januaryPayments: janP,
                februaryPayments: febP,
                marchPayments: marP,
                aprilPayments: aprP,
                mayPayments: mayP,
                junePayments: junP,
                julyPayments: julP,
                augustPayments: augP,
                septemberPayments: sepP,
                octoberPayments: octP,
                novemberPayments: novP,
                decemberPayments: decP,
                januaryCharges: janC,
                februaryCharges: febC,
                marchCharges: marC,
                aprilCharges: aprC,
                mayCharges: mayC,
                juneCharges: junC,
                julyCharges: julC,
                augustCharges: augC,
                septemberCharges: sepC,
                octoberCharges: octC,
                novemberCharges: novC,
                decemberCharges: decC,
              };
            }),
            skipDuplicates: true,
          });
        }
      );
      stats.created = toCreate.length;
    } catch (error) {
      errors.push(
        `Błąd tworzenia płatności: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped += toCreate.length;
    }
  }

  // Update only changed payments
  for (const { id, entry } of toUpdate) {
    try {
      const [
        janP,
        febP,
        marP,
        aprP,
        mayP,
        junP,
        julP,
        augP,
        sepP,
        octP,
        novP,
        decP,
      ] = entry.monthlyPayments;
      const [
        janC,
        febC,
        marC,
        aprC,
        mayC,
        junC,
        julC,
        augC,
        sepC,
        octC,
        novC,
        decC,
      ] = entry.monthlyCharges;
      await tx.payment.update({
        where: { id },
        data: {
          dateFrom: entry.dateFrom,
          dateTo: entry.dateTo,
          openingDebt: entry.openingDebt,
          openingSurplus: entry.openingSurplus,
          openingBalance: entry.openingBalance,
          closingBalance: entry.closingBalance,
          januaryPayments: janP,
          februaryPayments: febP,
          marchPayments: marP,
          aprilPayments: aprP,
          mayPayments: mayP,
          junePayments: junP,
          julyPayments: julP,
          augustPayments: augP,
          septemberPayments: sepP,
          octoberPayments: octP,
          novemberPayments: novP,
          decemberPayments: decP,
          januaryCharges: janC,
          februaryCharges: febC,
          marchCharges: marC,
          aprilCharges: aprC,
          mayCharges: mayC,
          juneCharges: junC,
          julyCharges: julC,
          augustCharges: augC,
          septemberCharges: sepC,
          octoberCharges: octC,
          novemberCharges: novC,
          decemberCharges: decC,
        },
      });
      stats.updated++;
    } catch (error) {
      errors.push(
        `Błąd aktualizacji płatności ${entry.externalId}/${entry.year}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
      stats.skipped++;
    }
  }
}
