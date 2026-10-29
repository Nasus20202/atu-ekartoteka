import { WPLATY_BALANCE_TOLERANCE } from '@/lib/import/constants';
import type { TransactionClient } from '@/lib/import/types';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

type CrossYearPaymentEntry = {
  externalId: string;
  apartmentCode: string;
  year: number;
  openingBalance: DecimalLike;
};

type CrossYearTransactionClient = Pick<TransactionClient, 'payment'>;

export async function validateCrossYearBalances(
  tx: CrossYearTransactionClient,
  apartmentMap: Map<string, string>,
  entries: CrossYearPaymentEntry[],
  errors: string[]
): Promise<void> {
  for (const entry of entries) {
    const prevYear = entry.year - 1;
    const apartmentId = apartmentMap.get(
      `${entry.externalId}#${entry.apartmentCode}`
    );
    if (!apartmentId) continue;

    const prevPayment = await tx.payment.findFirst({
      where: { apartmentId, year: prevYear },
      select: { closingBalance: true },
    });

    if (prevPayment) {
      const diff = toDecimal(entry.openingBalance)
        .minus(toDecimal(prevPayment.closingBalance))
        .abs();
      if (diff.greaterThan(WPLATY_BALANCE_TOLERANCE)) {
        const msg = `Lokal ${entry.apartmentCode}, rok ${entry.year}: saldo otwarcia ${entry.openingBalance} ≠ saldo zamknięcia ${prevPayment.closingBalance} roku ${prevYear}`;
        errors.push(msg);
        throw new Error(msg);
      }
    }
  }
}
