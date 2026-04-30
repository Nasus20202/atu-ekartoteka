import type { DecimalLike } from '@/lib/utils/decimal';

export type { Charge, ChargeNotification } from '@/generated/prisma/client';

export type ChargeDisplay = {
  id: string;
  description: string;
  quantity: DecimalLike;
  unit: string;
  unitPrice: DecimalLike;
  totalAmount: DecimalLike;
  dateFrom: Date;
  dateTo: Date;
};
