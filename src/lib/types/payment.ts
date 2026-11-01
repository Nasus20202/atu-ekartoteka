import type { Payment as StoredPayment } from '@/generated/prisma/client';
import type { DerivedPayment } from '@/lib/utils/payment-balances';

// Payment as presented: monthly charges and closing balance are derived from
// charge records, the incorrect values loaded from the files are removed.
export type Payment = DerivedPayment<StoredPayment>;
