import { EntityStats, TransactionClient } from '@/lib/import/types';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';

type PaymentKey = {
  apartmentId: string;
  year: number;
};

type ExistingPayment = PaymentKey & {
  id: string;
  dateFrom: Date;
  dateTo: Date;
  openingBalance: number;
  closingBalance: number;
  januaryPayments: number;
  februaryPayments: number;
  marchPayments: number;
  aprilPayments: number;
  mayPayments: number;
  junePayments: number;
  julyPayments: number;
  augustPayments: number;
  septemberPayments: number;
  octoberPayments: number;
  novemberPayments: number;
  decemberPayments: number;
  januaryCharges: number;
  februaryCharges: number;
  marchCharges: number;
  aprilCharges: number;
  mayCharges: number;
  juneCharges: number;
  julyCharges: number;
  augustCharges: number;
  septemberCharges: number;
  octoberCharges: number;
  novemberCharges: number;
  decemberCharges: number;
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
    existing.openingBalance !== entry.openingBalance ||
    existing.closingBalance !== entry.closingBalance ||
    existing.januaryPayments !== janP ||
    existing.februaryPayments !== febP ||
    existing.marchPayments !== marP ||
    existing.aprilPayments !== aprP ||
    existing.mayPayments !== mayP ||
    existing.junePayments !== junP ||
    existing.julyPayments !== julP ||
    existing.augustPayments !== augP ||
    existing.septemberPayments !== sepP ||
    existing.octoberPayments !== octP ||
    existing.novemberPayments !== novP ||
    existing.decemberPayments !== decP ||
    existing.januaryCharges !== janC ||
    existing.februaryCharges !== febC ||
    existing.marchCharges !== marC ||
    existing.aprilCharges !== aprC ||
    existing.mayCharges !== mayC ||
    existing.juneCharges !== junC ||
    existing.julyCharges !== julC ||
    existing.augustCharges !== augC ||
    existing.septemberCharges !== sepC ||
    existing.octoberCharges !== octC ||
    existing.novemberCharges !== novC ||
    existing.decemberCharges !== decC
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
  const validEntries = entries
    .map((entry) => ({
      entry,
      apartmentId: apartmentMap.get(
        `${entry.externalId}#${entry.apartmentCode}`
      ),
    }))
    .filter(
      (item): item is { entry: PaymentEntry; apartmentId: string } =>
        item.apartmentId !== undefined
    );

  stats.skipped = entries.length - validEntries.length;

  if (validEntries.length === 0) return;

  // Fetch all existing payments with full data for comparison
  const uniqueKeys = validEntries.map(({ entry, apartmentId }) => ({
    apartmentId,
    year: entry.year,
  }));

  const existingPayments = await tx.payment.findMany({
    where: {
      OR: uniqueKeys.map((k) => ({
        apartmentId: k.apartmentId,
        year: k.year,
      })),
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
      await tx.payment.createMany({
        data: toCreate.map(({ entry, apartmentId }) => {
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
